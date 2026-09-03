import * as THREE from "three/webgpu";

import { quality } from "../constants/quality";
import { createBaseScene, createPlatformReflections, unpackingBlenderScene } from "../three-scene";

export const applyReflections = (
  enabled: boolean,
  baseSceneObjects: ReturnType<typeof createBaseScene>,
  unpackedSceneObjects: Awaited<ReturnType<typeof unpackingBlenderScene>>,
  drawingSize: THREE.Vector2,
) => {
  const { scene, mainLightsNode, light, ambientLight, renderer } = baseSceneObjects;
  quality.reflections = enabled;
  if (!unpackedSceneObjects) return;

  if (enabled) {
    if (unpackedSceneObjects.reflections.length === 0) {
      unpackedSceneObjects.reflections.push(
        ...createPlatformReflections(
          scene,
          [
            unpackedSceneObjects.clientPlatform,
            unpackedSceneObjects.serverPlatform,
            unpackedSceneObjects.networkPlatform,
          ],
          mainLightsNode,
          light,
          ambientLight,
        ),
      );
      renderer.getDrawingBufferSize(drawingSize);
      unpackedSceneObjects.reflections.forEach((reflection) => {
        reflection.setSize(drawingSize.x, drawingSize.y);
      });
    }

    unpackedSceneObjects.reflections.forEach((reflection) => {
      reflection.mesh.visible = true;
    });
    return;
  }

  unpackedSceneObjects.reflections.forEach((reflection) => {
    reflection.mesh.visible = false;
  });
};
