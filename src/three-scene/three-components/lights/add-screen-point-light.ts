import * as THREE from "three/webgpu";

import { quality } from "../../../constants/quality";
import { getSize } from "../../../helpers";

export const addScreenPointLight = (scene: THREE.Scene, mesh: THREE.Mesh, withGreen?: boolean) => {
  const size = getSize(mesh);
  const intensity = 0.2;

  const y1 = mesh.position.y + size.y / 2 + 0.3;
  const cosY = Math.cos(mesh.rotation.y);
  const sinY = Math.sin(mesh.rotation.y);
  const x2 = (size.x / 2 + 0.3) * cosY;
  const z2 = (size.x / 2 + 0.3) * sinY;

  const positions: [number, number, number][] = [
    [mesh.position.x, y1, mesh.position.z],
    [mesh.position.x + x2, mesh.position.y, mesh.position.z - z2],
    [mesh.position.x + (size.x / 2 + 0.2) * cosY, y1 - 0.2, mesh.position.z - (size.x / 2 + 0.2) * sinY],
    [mesh.position.x + 0.3 * cosY, y1, mesh.position.z - 0.3 * sinY],
    [mesh.position.x - 0.3 * cosY, y1, mesh.position.z + 0.3 * sinY],
    [mesh.position.x + x2, mesh.position.y + 0.3, mesh.position.z - z2],
    [mesh.position.x + 0.6 * cosY, y1, mesh.position.z - 0.6 * sinY],
    [mesh.position.x - 0.6 * cosY, y1, mesh.position.z + 0.6 * sinY],

    [mesh.position.x + x2, mesh.position.y - 0.3, mesh.position.z - z2],
  ];

  for (const position of positions.slice(0, quality.screenPointLights)) {
    const pointLight = new THREE.PointLight(0xffffff, intensity, 1);
    pointLight.position.set(...position);
    scene.add(pointLight);
  }

  if (withGreen) {
    const pointLight = new THREE.PointLight(0x00ff00, 0.4, 10);
    pointLight.position.set(
      mesh.position.x + (size.x / 2 + 0.3) * cosY,
      mesh.position.y - size.y / 2 + 0.1,
      mesh.position.z + (size.x / 2 - 0.6) * sinY,
    );
    scene.add(pointLight);
  }
};
