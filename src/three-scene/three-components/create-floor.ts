import * as THREE from "three/webgpu";

import { quality } from "../../constants/quality";

export const createFloor = (
  scene: THREE.Scene,
  lightsNode: THREE.LightsNode,
  y: number,
  model: THREE.Object3D,
  gridHelper: THREE.GridHelper,
) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const floorY = box.min.y - 0.004;

  const material = new THREE.MeshStandardNodeMaterial({
    roughness: 0.92,
    metalness: 0.08,
    color: new THREE.Color(0x111129),
    lightsNode,
  });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(24, quality.floorSegments), material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center.x, y, center.z);
  floor.receiveShadow = true;
  floor.castShadow = false;
  floor.userData.receiveShadowOnly = true;
  scene.add(floor);

  gridHelper.position.set(center.x, floorY + 0.008, center.z);

  return floor;
};
