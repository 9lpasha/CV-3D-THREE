import { hashBlur } from "three/examples/jsm/tsl/display/hashBlur.js";
import { mix, reflector, sample, texture, uniform, uv, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";
import { getShapeGeometry } from "./shape";

export const getReflectMaterial = (
  scene: THREE.Scene,
  size: { x: number; z: number },
  position: { x: number; z: number; y: number },
) => {
  const planeGeo = getShapeGeometry(size.x * 0.98, size.z * 0.98); //new THREE.PlaneGeometry(size.x * 0.96, size.z * 0.96);
  const verticalReflector = reflector({ resolutionScale: 0.5, depth: true, bounces: false });
  const reflectionDepth = verticalReflector.getDepthNode();

  const floorNormal = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
  floorNormal.needsUpdate = true;
  floorNormal.wrapS = THREE.RepeatWrapping;
  floorNormal.wrapT = THREE.RepeatWrapping;

  const verticalUVOffset = texture(floorNormal, uv()).xy;
  verticalReflector.uvNode = verticalReflector.uvNode!.add(verticalUVOffset);

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
  planeBack.add(verticalReflector.target);
  scene.add(planeBack);
};

export const createReflectMaterials = (scene: THREE.Scene, object: THREE.Mesh) => {
  const material = object.material;
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  getReflectMaterial(scene, size, { x: object.position.x, z: object.position.z, y: size.y + 0.014 });

  // getReflectMaterial(scene, { x: 100, z: 100 }, { x: 0, z: 0, y: 0 });

  return material;
};
