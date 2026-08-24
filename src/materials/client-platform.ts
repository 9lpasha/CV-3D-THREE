import { hashBlur } from "three/examples/jsm/tsl/display/hashBlur.js";
import { color, mix, reflector, sample, uniform, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";
import { getShapeGeometry } from "../geometry/shape";
import { getSize } from "../helpers/get-size";

export const getReflectMaterial = (
  scene: THREE.Scene,
  size: { x: number; z: number },
  position: { x: number; z: number; y: number },
  rotation: THREE.Euler,
) => {
  const planeGeo = getShapeGeometry(size.x * 0.99, size.z * 0.99);
  const verticalReflector = reflector({ resolutionScale: 0.5, depth: true, bounces: false });
  const reflectionDepth = verticalReflector.getDepthNode();

  verticalReflector.uvNode = verticalReflector.uvNode!.add(color(0x000000)); //(verticalUVOffset);

  const roughness = uniform(1);
  const radiusRange = mix(0.61, 0.01, uniform(0.2));
  const roughnessRange = mix(0.3, 0.1, roughness);

  const maskReflection = sample((uv) => {
    const sample = verticalReflector.sample(uv);
    const mask = reflectionDepth.sample(uv);

    return vec4(sample.rgb, sample.a.mul(mask.r));
  }, verticalReflector.uvNode as THREE.Node<"vec2">);

  const reflectionBlurred = hashBlur(maskReflection, radiusRange, {
    premultipliedAlpha: true,
  });

  const reflectionMask = reflectionBlurred.a.mul(reflectionDepth).remapClamp(0, roughnessRange);
  const reflectionMixFactor = reflectionMask.mul(roughness.mul(2).min(1));

  // const verticalNode = vec4(0, 0, 0, 0).add(verticalReflector);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const verticalNode = mix(verticalReflector.rgb.mul(0.1), reflectionBlurred.rgb, reflectionMixFactor);

  const planeBack = new THREE.Mesh(
    planeGeo,
    new THREE.MeshStandardNodeMaterial({
      colorNode: verticalNode,
    }),
  );

  planeBack.position.z = position.z;
  planeBack.position.y = position.y;
  planeBack.position.x = position.x;
  planeBack.rotateX(-Math.PI / 2);
  planeBack.rotateZ(rotation.y);
  planeBack.add(verticalReflector.target);
  scene.add(planeBack);
};

export const createReflectMaterials = (scene: THREE.Scene, object: THREE.Mesh) => {
  const material = object.material;
  const size = getSize(object);

  getReflectMaterial(
    scene,
    size,
    {
      x: object.position.x,
      z: object.position.z,
      y: object.position.y + size.y / 2 + 0.001,
    },
    object.rotation,
  );

  // getReflectMaterial(scene, { x: 100, z: 100 }, { x: 0, z: 0, y: 0 });

  return material;
};
