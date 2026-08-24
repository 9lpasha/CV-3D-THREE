import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { color, positionLocal, texture, uniform } from "three/tsl";
import * as THREE from "three/webgpu";

import { BLUE_METALLIC_COLOR } from "../../constants/colors";
import { quality } from "../../constants/quality";

import { FLOW_SPEED } from "./create-particle-flow";
import { packetCharCounts } from "./create-text";

const CUBE_SIZE = 0.2;
const PLATFORM_SIZE = 0.34;
const PLATFORM_HEIGHT = 0.02;
const PLATFORM_RADIUS = 0.15;
const RIM_COLOR = 0x66f6ff;
const FADE_ZONE = CUBE_SIZE / 2;

const pointOnPath = (
  t: number,
  start: THREE.Vector3,
  mid: THREE.Vector3,
  end: THREE.Vector3,
  target: THREE.Vector3,
) => {
  const d1 = start.distanceTo(mid);
  const d2 = mid.distanceTo(end);
  const dist = Math.min(Math.max(t, 0), 1) * (d1 + d2);

  if (dist <= d1) {
    return target.lerpVectors(start, mid, dist / d1);
  }

  return target.lerpVectors(mid, end, (dist - d1) / d2);
};

const randomBit = () => (Math.random() < 0.5 ? "0" : "1");

const cubeFont = () => {
  const px = Math.max(12, Math.round((92 * quality.cubeTextureSize) / 256));
  return `700 ${px}px "Space Mono", monospace`;
};

const createBinaryTexture = () => {
  const size = quality.cubeTextureSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.font = cubeFont();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const col = Math.round((48 * size) / 256);
  const row = Math.round((52 * size) / 256);
  const line1 = `${randomBit()}${randomBit()}`;
  const line2 = `${randomBit()}${randomBit()}`;

  ctx.fillText(line1[0], size / 2 - col, size / 2 - row);
  ctx.fillText(line1[1], size / 2 + col, size / 2 - row);
  ctx.fillText(line2[0], size / 2 - col, size / 2 + row);
  ctx.fillText(line2[1], size / 2 + col, size / 2 + row);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  return map;
};

const addBinaryFaces = (cube: THREE.Mesh, opacityNode: THREE.Node<"float">, faceGeometry: THREE.PlaneGeometry) => {
  const offset = CUBE_SIZE / 2 + 0.004;
  const faces = [
    { position: [0, 0, offset], rotation: 0 },
    { position: [0, 0, -offset], rotation: Math.PI },
    { position: [offset, 0, 0], rotation: Math.PI / 2 },
    { position: [-offset, 0, 0], rotation: -Math.PI / 2 },
  ] as const;

  const map = createBinaryTexture();
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  material.colorNode = texture(map);
  material.opacityNode = texture(map).a.mul(opacityNode);

  for (const face of faces) {
    const plane = new THREE.Mesh(faceGeometry, material);
    plane.frustumCulled = false;
    plane.position.set(face.position[0], face.position[1], face.position[2]);
    plane.rotation.y = face.rotation;
    cube.add(plane);
  }
};

const createCubeGroup = (
  cubeMaterial: THREE.Material,
  platformMaterial: THREE.Material,
  cubeGeometry: THREE.BufferGeometry,
  platformGeometry: THREE.BufferGeometry,
) => {
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = quality.cubeCastShadow;
  cube.frustumCulled = false;

  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.castShadow = quality.cubeCastShadow;
  platform.receiveShadow = quality.shadows;
  platform.frustumCulled = false;
  platform.position.y = -(CUBE_SIZE / 2 + PLATFORM_HEIGHT / 2 + 0.01);

  const group = new THREE.Group();
  group.add(cube);
  group.add(platform);
  group.frustumCulled = false;

  return { group, cube };
};

export const createFlowCube = async (
  scene: THREE.Scene,
  from: THREE.Object3D,
  via: THREE.Object3D,
  to: THREE.Object3D,
  obstacles: THREE.Object3D[] = [],
  onArrive?: (chars: number) => void,
) => {
  const cubeCount = quality.cubeCount;
  const start = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const end = new THREE.Vector3();
  from.getWorldPosition(start);
  via.getWorldPosition(mid);
  to.getWorldPosition(end);

  const obstacleBoxes = obstacles.map((obstacle) => new THREE.Box3().setFromObject(obstacle));
  const half = PLATFORM_SIZE / 2;
  const rimMask = positionLocal.x.abs().div(half).max(positionLocal.z.abs().div(half)).smoothstep(0.96, 0.999);
  const cubeGeometry = new RoundedBoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 1, 0.01);
  const platformGeometry = new RoundedBoxGeometry(
    PLATFORM_SIZE,
    PLATFORM_HEIGHT,
    PLATFORM_SIZE,
    quality.platformRadiusSegments,
    PLATFORM_RADIUS,
  );
  const faceGeometry = new THREE.PlaneGeometry(CUBE_SIZE * 0.7, CUBE_SIZE * 0.7);

  const groups: THREE.Group[] = [];

  for (let i = 0; i < cubeCount; i++) {
    const opacityNode = uniform(1, "float");
    const cubeMaterial = new THREE.MeshStandardNodeMaterial({
      color: 0x015cff,
      emissive: 0x015cff,
      emissiveIntensity: 0.5,
      roughness: 0.28,
      metalness: 0.18,
      transparent: true,
    });
    cubeMaterial.opacityNode = opacityNode;

    const platformMaterial = new THREE.MeshStandardNodeMaterial({
      color: BLUE_METALLIC_COLOR,
      roughness: 0.7,
      metalness: 0.35,
      transparent: true,
      emissiveNode: color(RIM_COLOR).mul(rimMask.mul(0.7)).mul(opacityNode),
    });
    platformMaterial.opacityNode = opacityNode;

    const { group, cube } = createCubeGroup(cubeMaterial, platformMaterial, cubeGeometry, platformGeometry);
    group.visible = false;
    scene.add(group);
    groups.push(group);
    group.userData.cube = cube;
    group.userData.opacityNode = opacityNode;
    group.userData.active = false;
    group.userData.delivered = false;
    group.userData.spawnAt = 0;
    group.userData.charCount = 0;
  }

  try {
    await Promise.race([
      document.fonts.load(cubeFont()),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 4000);
      }),
    ]);
  } catch {
    // fallback system monospace is fine for a missing webfont
  }

  for (const group of groups) {
    addBinaryFaces(group.userData.cube as THREE.Mesh, group.userData.opacityNode as THREE.Node<"float">, faceGeometry);
  }

  const current = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const closest = new THREE.Vector3();

  const opacityFromObstacles = (point: THREE.Vector3) => {
    let opacity = 1;

    for (const box of obstacleBoxes) {
      if (box.containsPoint(point)) {
        return 0;
      }

      box.clampPoint(point, closest);
      const dist = point.distanceTo(closest);
      if (dist < FADE_ZONE) {
        opacity = Math.min(opacity, dist / FADE_ZONE);
      }
    }

    return opacity;
  };

  const destBox = new THREE.Box3().setFromObject(to);
  const pathLength = start.distanceTo(mid) + mid.distanceTo(end);
  const firstLeg = start.distanceTo(mid);
  const spawnInterval = 1 / (cubeCount * FLOW_SPEED);
  const packets = packetCharCounts();
  let nextPacket = 0;
  let nextSpawnAt = 0;

  let originTime: number | undefined;

  const update = (elapsedTime: number) => {
    if (originTime === undefined) {
      originTime = elapsedTime;
    }

    const localTime = elapsedTime - originTime;

    while (nextPacket < packets.length && localTime >= nextSpawnAt) {
      const cube = groups.find((group) => !group.userData.active);
      if (!cube) break;

      cube.userData.active = true;
      cube.userData.delivered = false;
      cube.userData.spawnAt = nextSpawnAt;
      cube.userData.charCount = packets[nextPacket];
      nextPacket += 1;
      nextSpawnAt += spawnInterval;
    }

    for (const group of groups) {
      if (!group.userData.active) {
        group.visible = false;
        continue;
      }

      const t = (localTime - group.userData.spawnAt) * FLOW_SPEED;

      if (t <= 0) {
        group.visible = false;
        continue;
      }

      pointOnPath(t, start, mid, end, current);
      pointOnPath(t + 0.012, start, mid, end, ahead);
      group.position.copy(current);
      group.rotation.y = Math.atan2(ahead.x - current.x, ahead.z - current.z);

      const opacityNode = group.userData.opacityNode as { value: number };
      opacityNode.value = opacityFromObstacles(current);
      group.visible = opacityNode.value > 0.001;

      const onSecondLeg = Math.min(t, 1) * pathLength > firstLeg;
      if (!group.userData.delivered && onSecondLeg && destBox.containsPoint(current)) {
        group.userData.delivered = true;
        onArrive?.(group.userData.charCount as number);
      }

      if (group.userData.delivered && opacityNode.value <= 0.001) {
        group.userData.active = false;
        group.visible = false;
      }
    }
  };

  const warmup = () => {
    for (const group of groups) {
      group.position.copy(start);
      group.visible = true;
      (group.userData.opacityNode as { value: number }).value = 1;
    }
  };

  const hideAll = () => {
    for (const group of groups) {
      group.userData.active = false;
      group.visible = false;
    }
  };

  return { update, warmup, hideAll };
};
