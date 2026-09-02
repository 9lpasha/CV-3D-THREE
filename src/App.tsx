import { useEffect, useState } from "react";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three/webgpu";

import Stats from "three/addons/libs/stats.module.js";

import "./App.css";
import jsonFlow from "./assets/json_flow.glb";
import { Hud } from "./components/hud";
import { Loader } from "./components/loader";
import { quality } from "./constants/quality";
import { createFloor, createFlowCube, createParticleFlow } from "./three-scene/three-components";
import { createReflections, unpackingBlenderScene } from "./three-scene";
import { createBaseScene } from "./three-scene";
import { createPostProcessing } from "./three-scene";

const stats = new Stats();
stats.dom.className = "stats";
document.body.appendChild(stats.dom);

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    let disposed = false;

    const { camera, scene, renderer, controls, mainLightsNode, ambientLight, light } = createBaseScene(canvas);

    let unpackedSceneObjects: Awaited<ReturnType<typeof unpackingBlenderScene>> | undefined;
    const mirrorScene = new THREE.Scene();
    mirrorScene.add(ambientLight.clone(), light.clone());

    /**
     * Grid (Сетка на полу)
     */
    const gridHelper = new THREE.GridHelper(24, quality.gridDivisions, 0x333355, 0x222233);
    scene.add(gridHelper);

    /**
     * Loaders
     */
    const dracoLoader = new DRACOLoader();
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    /**
     * Clock (Animate)
     */
    const clock = new THREE.Clock(false);
    const animateActions: ((elapsedTime: number) => void)[] = [];

    const { renderFrame, compileFrame } = createPostProcessing(scene, camera, renderer);

    function tick() {
      const elapsed = clock.getElapsedTime();
      animateActions.forEach((action) => action(elapsed));

      controls.update();
      if (unpackedSceneObjects?.reflections && mirrorScene) {
        unpackedSceneObjects.reflections.forEach((reflection) => {
          reflection.update(camera);
          reflection.render(renderer, mirrorScene);
        });
      }

      stats.begin();
      renderFrame();
      stats.end();
    }

    /**
     * Основная логика
     */
    (async () => {
      await renderer.init();
      if (disposed) return;

      /** Загрузка модели */
      const gltf = await gltfLoader.loadAsync(jsonFlow);
      if (disposed) return;
      const model = gltf.scene;
      unpackedSceneObjects = await unpackingBlenderScene(scene, model, mainLightsNode, light, ambientLight);
      const { serverGreenJson, greenJson, routerPlatform, textJobs, screenText } = unpackedSceneObjects;
      scene.add(gltf.scene);
      model.updateMatrixWorld(true);
      await Promise.all(textJobs);

      /** Отражения */
      if (quality.reflections) {
        createReflections(unpackedSceneObjects, mirrorScene);
      }

      /** Создание пола */
      createFloor(scene, mainLightsNode, -0.004, model, gridHelper);

      /** Создание частиц и движения кубиков */
      if (serverGreenJson && greenJson && routerPlatform) {
        createParticleFlow(scene, serverGreenJson, routerPlatform, greenJson);
        const flow = await createFlowCube(
          scene,
          serverGreenJson,
          routerPlatform,
          greenJson,
          [routerPlatform, greenJson],
          mainLightsNode,
          (chars) => screenText?.reveal(chars),
        );
        flow.warmup();
        animateActions.push(flow.update);
      }

      if (disposed) return;

      await compileFrame();
      renderFrame();
      renderFrame();

      if (disposed) return;

      setReady(true);
      clock.start();
      renderer.setAnimationLoop(tick);
    })();

    const onVisibility = () => {
      if (!clock.running) return;
      renderer.setAnimationLoop(document.hidden ? null : tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const drawingSize = new THREE.Vector2();

    const onResize = () => {
      const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(quality.pixelRatio);
      renderer.getDrawingBufferSize(drawingSize);

      if (unpackedSceneObjects?.reflections) {
        unpackedSceneObjects.reflections.forEach((reflection) => {
          reflection.setSize(drawingSize.x, drawingSize.y);
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas id="canvas"></canvas>
      <Hud />
      <Loader ready={ready} />
    </>
  );
}
