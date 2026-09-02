import * as THREE from "three/webgpu";
import { getMirroredObject } from "../helpers";
import type { unpackingBlenderScene } from "./unpackingBlenderScene";

export const createReflections = (
  unpackedSceneObjects: Awaited<ReturnType<typeof unpackingBlenderScene>>,
  mirrorScene: THREE.Scene,
) => {
  const {
    screenJson,
    greenJson,
    greenJsonText,
    clientPlatform,
    routerPlatform,
    routerPlatformLights,
    serverGreenJson,
    serverGreenJsonText,
    machine,
    machineLights,
  } = unpackedSceneObjects;

  /** отражения клиентской платформы */
  getMirroredObject({
    object: screenJson,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
    color: new THREE.Color(0x000000),
  });
  getMirroredObject({ object: greenJson, mirrorY: clientPlatform.position.y, mirrorScene });
  getMirroredObject({
    object: greenJsonText,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0xffffff),
  });

  /** отражения роутера */
  getMirroredObject({
    object: routerPlatform,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0x000000),
    fadeDistance: 1,
  });
  getMirroredObject({
    object: routerPlatformLights,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });

  /** отражения серверной платформы */
  getMirroredObject({
    object: serverGreenJson,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
  });
  getMirroredObject({
    object: machine,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });
  getMirroredObject({
    object: serverGreenJsonText,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    color: new THREE.Color(0xffffff),
  });
  getMirroredObject({
    object: machineLights,
    mirrorY: clientPlatform.position.y,
    mirrorScene,
    fadeDistance: 1,
  });
};
