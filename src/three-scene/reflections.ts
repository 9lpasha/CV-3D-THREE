import * as THREE from "three/webgpu";

import { getMirroredObject, getSize } from "../helpers";
import { createTopFaceReflection } from "../materials";
import type { unpackingBlenderScene } from "./unpackingBlenderScene";

export const createPlatformReflections = (
  scene: THREE.Scene,
  platforms: Array<THREE.Mesh | undefined>,
  mainLightsNode: THREE.LightsNode,
  light: THREE.Light,
  ambientLight: THREE.AmbientLight,
) => {
  const reflections: ReturnType<typeof createTopFaceReflection>[] = [];

  for (const mesh of platforms) {
    if (!mesh) continue;

    const material = mesh.material as THREE.MeshStandardMaterial;
    const size = getSize(mesh);
    const baseMaterial = new THREE.MeshStandardNodeMaterial({
      ...material,
      color: new THREE.Color(0x081840),
      lightsNode: mainLightsNode,
    });

    const reflectionMesh = createTopFaceReflection({
      planePosition: {
        x: mesh.position.x,
        z: mesh.position.z,
        y: mesh.position.y + size.y / 2 + 0.001,
      },
      planeRotation: mesh.rotation,
      planeSize: size,
      baseMaterial,
      lightDirection: light.position,
      lightColor: light.color,
      ambientIntensity: ambientLight.intensity,
    });
    reflectionMesh.mesh.receiveShadow = false;
    reflectionMesh.mesh.castShadow = false;
    reflectionMesh.mesh.userData.isReflection = true;
    scene.add(reflectionMesh.mesh);
    reflections.push(reflectionMesh);
  }

  return reflections;
};

export const createMirroredObjects = (
  unpackedSceneObjects: Awaited<ReturnType<typeof unpackingBlenderScene>>,
  mirrorScene: THREE.Scene,
) => {
  const {
    screenJson,
    screenJsonDark,
    greenJson,
    greenJsonText,
    clientPlatform,
    routerPlatform,
    routerPlatformLights,
    serverGreenJson,
    serverGreenJsonText,
    machine,
    machineLights,
  } = unpackedSceneObjects;

  /** отражения клиентской платформы */
  getMirroredObject({
    object: screenJson,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
    color: new THREE.Color(0x000000),
  });
  getMirroredObject({
    object: screenJsonDark,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
    color: new THREE.Color(0x000000),
  });
  getMirroredObject({ object: greenJson, mirrorY: clientPlatform.position.y, mirrorScene });
  getMirroredObject({
    object: greenJsonText,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0xffffff),
  });

  /** отражения роутера */
  getMirroredObject({
    object: routerPlatform,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0x000000),
    fadeDistance: 1,
  });
  getMirroredObject({
    object: routerPlatformLights,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });

  /** отражения серверной платформы */
  getMirroredObject({
    object: serverGreenJson,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
  });
  getMirroredObject({
    object: machine,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });
  getMirroredObject({
    object: serverGreenJsonText,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0xffffff),
  });
  getMirroredObject({
    object: machineLights,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });
};
