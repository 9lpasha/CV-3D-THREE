import { float, positionWorld, saturate } from "three/tsl";
import { MeshStandardNodeMaterial, type ColorRepresentation } from "three/webgpu";

export function createReflectableMaterial(planeY: number, fadeDistance: number, color: ColorRepresentation) {
  const depth = positionWorld.y.sub(planeY);
  const fade = saturate(float(1).sub(depth.div(Math.max(fadeDistance, 1e-4))));
  const material = new MeshStandardNodeMaterial({
    color,
    roughness: 1,
    metalness: 0,
    transparent: true,
  });
  material.opacityNode = fade;
  return material;
}
