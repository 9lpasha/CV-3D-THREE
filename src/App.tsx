import { useEffect, useState } from "react";
import { DRACOLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { float, lights, mrt, output, pass } from "three/tsl";
import * as THREE from "three/webgpu";

import Stats from "three/addons/libs/stats.module.js";

import "./App.css";
import jsonFlow from "./assets/json_flow.glb";
import { Hud } from "./components/hud";
import { Loader } from "./components/loader";
import { BLUE_METALLIC_COLOR } from "./constants/colors";
import { quality } from "./constants/quality";
import { createFloor, createFlowCube, createParticleFlow, createText } from "./helpers/create-functions";
import { getSize } from "./helpers/get-size";
import { addScreenPointLight } from "./helpers/lights";
import { addAntenaPointLight } from "./helpers/lights/add-antena-point-light";
import { createReflectMaterials } from "./materials";

const stats = new Stats();
stats.dom.className = "stats";
document.body.appendChild(stats.dom);

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
    let disposed = false;

    /**
     * Scene
     */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000836);

    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.x = 10.2;
    camera.position.y = 6.7;
    camera.position.z = 7;
    scene.add(camera);

    /**
     * Controls
     */
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2 - 0.4;
    controls.maxPolarAngle = Math.PI / 2 - 0.4;
    controls.target.set(0, 0.5, -3.5);

    /**
     * Renderer
     */
    const renderer = new THREE.WebGPURenderer({
      canvas: canvas,
      antialias: quality.antialias,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(quality.pixelRatio);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Сетка на полу
    const gridHelper = new THREE.GridHelper(24, quality.gridDivisions, 0x333355, 0x222233);
    scene.add(gridHelper);

    /**
     * Loaders
     */
    // Draco loader
    const dracoLoader = new DRACOLoader();

    // GLTF loader
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.intensity = 2.3;
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 8, 5);

    light.castShadow = quality.shadows;
    light.target.position.set(0.5, 0, -3.5);
    scene.add(light.target);
    scene.add(light);

    // удаление искажений
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.02;

    // четкость теней
    light.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);

    // ограничения камеры тени
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 50;

    const mainLightsNode = lights([light, ambientLight]);
    let updateFlowCube: ((elapsedTime: number) => void) | undefined;
    const gltfPromise = gltfLoader.loadAsync(jsonFlow);

    const onResize = () => {
      const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(quality.pixelRatio);
    };

    window.addEventListener("resize", onResize);

    /**
     * Post-Processing
     */
    let renderFrame: () => void;
    let compileFrame: () => Promise<void>;

    if (quality.bloom) {
      const scenePass = pass(scene, camera);
      scenePass.setMRT(
        mrt({
          output,
          bloomIntensity: float(0.1),
        }),
      );

      const outputPass = scenePass.getTextureNode();
      const bloomIntensityPass = scenePass.getTextureNode("bloomIntensity");
      const bloomPass = bloom(outputPass.mul(bloomIntensityPass), 1, 0, 0);
      const renderPipeline = new THREE.RenderPipeline(renderer);
      renderPipeline.outputColorTransform = false;
      renderPipeline.outputNode = outputPass.add(bloomPass).renderOutput();

      renderFrame = () => {
        renderPipeline.render();
      };
      compileFrame = async () => {
        await scenePass.compileAsync(renderer);
        renderPipeline.render();
      };
    } else {
      renderFrame = () => {
        renderer.render(scene, camera);
      };
      compileFrame = async () => {
        await renderer.compileAsync(scene, camera);
        renderer.render(scene, camera);
      };
    }

    /**
     * Animate
     */
    const clock = new THREE.Clock(false);
    function tick() {
      const elapsed = clock.getElapsedTime();
      updateFlowCube?.(elapsed);

      controls.update();
      stats.begin();
      renderFrame();
      stats.end();
    }

    const boot = async () => {
      await renderer.init();
      if (disposed) return;

      const gltf = await gltfPromise;
      if (disposed) return;

      const model = gltf.scene;
      let serverGreenJson: THREE.Mesh | undefined;
      let greenJson: THREE.Mesh | undefined;
      let routerPlatform: THREE.Mesh | undefined;
      let screenText: Awaited<ReturnType<typeof createText>> | undefined;
      const textJobs: Promise<unknown>[] = [];

      model.traverse((child) => {
        child.castShadow = quality.modelCastShadow || child.name.includes("Platform");
        child.receiveShadow = quality.modelCastShadow;

        if (child.type !== "Mesh") return;

        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        material.emissiveIntensity = 0;

        if (material.name === "BlueMetallic") {
          material.color = new THREE.Color(BLUE_METALLIC_COLOR);
        }

        if (material.name === "WhiteText") {
          material.emissiveIntensity = 0;
        } else if (material.name === "GreenGlow") {
          material.emissiveIntensity = 0.3;
        } else if (material.name === "GreenText") {
          material.emissiveIntensity = 2;
        } else if (
          mesh.name === "ClientPlatform" ||
          mesh.name === "ServerPlatform" ||
          mesh.name === "NetworkPlatform"
        ) {
          if (quality.reflections) {
            mesh.material = createReflectMaterials(scene, mesh, mainLightsNode);
          }

          (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(0x122866);
        } else if (material.name === "Green") {
          material.emissiveIntensity = 0.01;
        } else if (mesh.name.includes("Button")) {
          material.emissiveIntensity = 0;
        } else if (mesh.name === "ScreenJson") {
          textJobs.push(
            createText(scene, mesh, { progressive: true }).then((controller) => {
              screenText = controller;
            }),
          );
        } else if (mesh.name === "ServerScreen") {
          const size = getSize(mesh);
          const pointLight = new THREE.PointLight(0x00ff00, 0.4, 1);
          pointLight.position.set(
            mesh.position.x - (size.x / 2 - 0.2),
            mesh.position.y - size.y / 2 + 0.3,
            mesh.position.z + 0.5,
          );
          scene.add(pointLight);

          textJobs.push(createText(scene, mesh));
        } else if (mesh.name === "Antena") {
          const pointLight = new THREE.PointLight(0x00ffff, 2, 1.2);
          const size = getSize(mesh);
          pointLight.position.set(mesh.position.x, mesh.position.y + size.y + 0.3, mesh.position.z - 0.3);
          scene.add(pointLight);
        }

        material.lightsNode = mainLightsNode;

        if (material.name === "BlueMetallic") {
          mesh.material = new THREE.MeshStandardMaterial({
            ...material,
            color: new THREE.Color(BLUE_METALLIC_COLOR),
            roughness: 0.7,
          });
        }

        if (mesh.name === "NetworkPlatform") {
          const size = getSize(mesh);
          const pointLight = new THREE.PointLight(0x00ffff, 1, 1);
          pointLight.position.set(
            mesh.position.x + size.x / 2 + 0.5,
            mesh.position.y,
            mesh.position.z + size.z / 2 + 0.5,
          );
          scene.add(pointLight);

          mesh.material = new THREE.MeshStandardMaterial({
            ...material,
            color: new THREE.Color(BLUE_METALLIC_COLOR),
            roughness: 1,
          });
        }

        if (mesh.name === "ClientPlatform") {
          (mesh.material as THREE.MeshStandardMaterial).lightsNode = mainLightsNode;
        }

        if (mesh.name.includes("Screen")) {
          addScreenPointLight(scene, mesh);
        }

        if (mesh.name.includes("Antena")) {
          addAntenaPointLight(scene, mesh);
        }

        if (mesh.name === "ServerGreenJson") {
          serverGreenJson = mesh;
        }

        if (mesh.name === "GreenJson") {
          greenJson = mesh;
        }

        if (mesh.name === "RouterPlatform") {
          routerPlatform = mesh;
        }
      });

      scene.add(gltf.scene);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const floorY = box.min.y - 0.004;

      createFloor(scene, mainLightsNode, floorY, { x: center.x, z: center.z });
      gridHelper.position.set(center.x, floorY + 0.008, center.z);

      await Promise.all(textJobs);

      let hideCubes: (() => void) | undefined;

      if (serverGreenJson && greenJson && routerPlatform) {
        createParticleFlow(scene, serverGreenJson, routerPlatform, greenJson);
        const flow = await createFlowCube(
          scene,
          serverGreenJson,
          routerPlatform,
          greenJson,
          [routerPlatform, greenJson],
          (chars) => screenText?.reveal(chars),
        );
        flow.warmup();
        hideCubes = flow.hideAll;
        updateFlowCube = flow.update;
      }

      if (disposed) return;

      await compileFrame();
      hideCubes?.();
      renderFrame();
      renderFrame();

      if (disposed) return;

      setReady(true);
      clock.start();
      renderer.setAnimationLoop(tick);
    };

    const onVisibility = () => {
      if (!clock.running) return;
      renderer.setAnimationLoop(document.hidden ? null : tick);
    };

    document.addEventListener("visibilitychange", onVisibility);

    void boot();

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
