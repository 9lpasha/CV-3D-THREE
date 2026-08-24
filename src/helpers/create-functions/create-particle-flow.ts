import { color, float, Fn, instanceIndex, mix, time, uniform, uv, vec2 } from "three/tsl";
import * as THREE from "three/webgpu";

import { quality } from "../../constants/quality";

export const FLOW_SPEED = 0.08;

export const createParticleFlow = (
  scene: THREE.Scene,
  from: THREE.Object3D,
  via: THREE.Object3D,
  to: THREE.Object3D,
) => {
  const PARTICLE_COUNT = quality.particleCount;
  const startPos = new THREE.Vector3();
  const viaPos = new THREE.Vector3();
  const endPos = new THREE.Vector3();
  from.getWorldPosition(startPos);
  via.getWorldPosition(viaPos);
  to.getWorldPosition(endPos);

  // Keep the stream under the traveling cube platform
  const belowPlatform = 0.18;
  startPos.y -= belowPlatform;
  viaPos.y -= belowPlatform;
  endPos.y -= belowPlatform;

  const start = uniform(startPos);
  const mid = uniform(viaPos);
  const end = uniform(endPos);

  const material = new THREE.SpriteNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;

  material.positionNode = Fn(() => {
    const t = instanceIndex.toFloat().add(0.5).div(PARTICLE_COUNT).add(time.mul(FLOW_SPEED)).fract();
    const d1 = start.sub(mid).length();
    const d2 = mid.sub(end).length();
    const dist = t.mul(d1.add(d2));
    const onSecond = dist.sub(d1).max(0).sign();
    const first = mix(start, mid, dist.div(d1).min(1));
    const second = mix(mid, end, dist.sub(d1).div(d2).clamp(0, 1));

    return mix(first, second, onSecond);
  })();

  const lifeFade = Fn(() => {
    const t = instanceIndex.toFloat().add(0.5).div(PARTICLE_COUNT).add(time.mul(FLOW_SPEED)).fract();
    return t.mul(float(1).sub(t)).mul(4).min(1);
  })();

  const circle = uv().sub(0.5).length().mul(2).oneMinus().saturate().pow(2.2);

  material.colorNode = mix(color(0x7c3aed), color(0xe879f9), instanceIndex.toFloat().div(PARTICLE_COUNT));
  material.scaleNode = vec2(0.028);
  material.opacityNode = circle.mul(lifeFade).mul(0.95);

  const particles = new THREE.Sprite(material);
  particles.count = PARTICLE_COUNT;
  particles.frustumCulled = false;
  particles.renderOrder = 2;
  scene.add(particles);

  return particles;
};
