import * as THREE from "three/webgpu";

import { createReflectableMaterial } from "../materials";

interface Params {
  object: THREE.Mesh;
  mirrorY: number;
  mirrorScene: THREE.Scene;
  fadeDistance?: number;
  color?: THREE.Color;
}

export const getMirroredObject = ({ mirrorScene, mirrorY, object, fadeDistance, color }: Params) => {
  const mirrorMaterial = createReflectableMaterial(
    mirrorY,
    fadeDistance || (object.position.y - mirrorY) * 1.5,
    color || (object.material as THREE.MeshStandardMaterial).color,
  );

  const objectMirror = object?.clone() as THREE.Mesh;
  objectMirror.material = mirrorMaterial;
  objectMirror.castShadow = false;

  mirrorScene.add(objectMirror);
};
