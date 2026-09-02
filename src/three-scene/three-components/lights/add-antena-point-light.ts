import * as THREE from "three/webgpu";

import { quality } from "../../../constants/quality";
import { getSize } from "../../../helpers";

export const addAntenaPointLight = (scene: THREE.Scene, mesh: THREE.Mesh) => {
  const size = getSize(mesh);
  const intensity = 0.7;
  const color = 0x00ffff;
  const y = mesh.position.y + size.y - 0.1;

  const positions: [number, number, number][] = [
    [mesh.position.x, y, mesh.position.z + 0.1],
    [mesh.position.x, y, mesh.position.z - 0.1],
    [mesh.position.x + 0.1, y, mesh.position.z],
    [mesh.position.x - 0.1, y, mesh.position.z],
  ];

  for (const position of positions.slice(0, quality.antennaPointLights)) {
    const pointLight = new THREE.PointLight(color, intensity, 0.1);
    pointLight.position.set(...position);
    scene.add(pointLight);
  }
};
