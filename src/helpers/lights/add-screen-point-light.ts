import * as THREE from "three/webgpu";

import { getSize } from "../get-size";

export const addScreenPointLight = (scene: THREE.Scene, mesh: THREE.Mesh) => {
  const size = getSize(mesh);
  const intensity = 0.2;

  const y1 = mesh.position.y + size.y / 2 + 0.3;
  const pointLight = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight.position.set(mesh.position.x, y1, mesh.position.z);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight2.position.set(
    mesh.position.x + 0.3 * Math.cos(mesh.rotation.y),
    y1,
    mesh.position.z - 0.3 * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight3.position.set(
    mesh.position.x - 0.3 * Math.cos(mesh.rotation.y),
    y1,
    mesh.position.z + 0.3 * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight3);

  const pointLight4 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight4.position.set(
    mesh.position.x + 0.6 * Math.cos(mesh.rotation.y),
    y1,
    mesh.position.z - 0.6 * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight4);

  const pointLight5 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight5.position.set(
    mesh.position.x - 0.6 * Math.cos(mesh.rotation.y),
    y1,
    mesh.position.z + 0.6 * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight5);

  const x2 = (size.x / 2 + 0.3) * Math.cos(mesh.rotation.y);
  const z2 = (size.x / 2 + 0.3) * Math.sin(mesh.rotation.y);

  const pointLight6 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight6.position.set(mesh.position.x + x2, mesh.position.y + 0.3, mesh.position.z - z2);
  scene.add(pointLight6);

  const pointLight7 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight7.position.set(mesh.position.x + x2, mesh.position.y, mesh.position.z - z2);
  scene.add(pointLight7);

  const pointLight8 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight8.position.set(mesh.position.x + x2, mesh.position.y - 0.3, mesh.position.z - z2);
  scene.add(pointLight8);

  const pointLight9 = new THREE.PointLight(0xffffff, intensity, 1);
  pointLight9.position.set(
    mesh.position.x + (size.x / 2 + 0.2) * Math.cos(mesh.rotation.y),
    y1 - 0.2,
    mesh.position.z - (size.x / 2 + 0.2) * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight9);

  const pointLight10 = new THREE.PointLight(0x00ff00, 0.4, 10);
  pointLight10.position.set(
    mesh.position.x + (size.x / 2 + 0.3) * Math.cos(mesh.rotation.y),
    mesh.position.y - size.y / 2 + 0.1,
    mesh.position.z + (size.x / 2 - 0.6) * Math.sin(mesh.rotation.y),
  );
  scene.add(pointLight10);
};
