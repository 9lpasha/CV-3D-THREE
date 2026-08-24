import * as THREE from "three/webgpu";

import { getSize } from "../get-size";

export const addAntenaPointLight = (scene: THREE.Scene, mesh: THREE.Mesh) => {
  const size = getSize(mesh);
  const intensity = 0.7;
  const color = 0x00ffff;

  const pointLight = new THREE.PointLight(color, intensity, 0.1);
  pointLight.position.set(mesh.position.x, mesh.position.y + size.y - 0.1, mesh.position.z + 0.1);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(color, intensity, 0.1);
  pointLight2.position.set(mesh.position.x, mesh.position.y + size.y - 0.1, mesh.position.z - 0.1);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(color, intensity, 0.1);
  pointLight3.position.set(mesh.position.x + 0.1, mesh.position.y + size.y - 0.1, mesh.position.z);
  scene.add(pointLight3);

  const pointLight4 = new THREE.PointLight(color, intensity, 0.1);
  pointLight4.position.set(mesh.position.x - 0.1, mesh.position.y + size.y - 0.1, mesh.position.z);
  scene.add(pointLight4);

  // const sphereSize = 1;

  // const pointLightHelper5 = new THREE.PointLightHelper(pointLight, sphereSize);
  // scene.add(pointLightHelper5);
};
