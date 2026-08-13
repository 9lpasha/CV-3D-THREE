import { useEffect } from "react";
import "./App.css";

import jsonFlow from "./assets/json_flow.glb";

import * as THREE from "three/webgpu";
import { float, mrt, output, pass } from "three/tsl";

import { DRACOLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";

import { createReflectMaterials } from "./materials";
import { createText } from "./helpers/create-text";

export function App() {
  useEffect(() => {
    const canvas = document.querySelector("#canvas") as HTMLCanvasElement;

    /**
     * Scene
     */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000836);

    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.x = 2.2;
    camera.position.y = 1.7;
    camera.position.z = 2.2;
    scene.add(camera);

    /**
     * Renderer
     */
    const renderer = new THREE.WebGPURenderer({
      canvas: canvas,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Сетка на полу
    const gridHelper = new THREE.GridHelper(15, 20, 0x333355, 0x222233);
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
    ambientLight.intensity = 1.3;
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 8, 5);

    light.castShadow = true;
    scene.add(light);

    // удаление искажений
    light.shadow.normalBias = 0.01;

    // четкость теней
    light.shadow.mapSize.set(2048, 2048);

    // ограничения камеры тени
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 50;

    /**
     * Загрузка 3D объекта из Blender
     */
    gltfLoader.load(jsonFlow, (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.type !== "Mesh") return;

        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        material.emissiveIntensity = 0;

        if (mesh.name === "ClientText") {
          material.emissiveIntensity = 0;
        } else if (mesh.name === "GlowLine") {
          material.emissiveIntensity = 0.3;
        } else if (mesh.name === "TextJson") {
          material.emissiveIntensity = 2;
        } else if (mesh.name === "ClientPlatform") {
          mesh.material = createReflectMaterials(scene, mesh);

          (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(0x122866);
        } else if (mesh.name === "GreenJson") {
          material.emissiveIntensity = 0.01;
        } else if (mesh.name.includes("Button")) {
          material.emissiveIntensity = 0;
        } else if (mesh.name === "ScrenJson") {
          createText(scene, mesh.position, mesh.rotation);
        }
      });

      scene.add(gltf.scene);
    });

    window.addEventListener("resize", () => {
      const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Update camera
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2 - 0.7;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(0, 0.5, 0);

    /**
     * Post-Processing
     */
    const scenePass = pass(scene, camera);
    scenePass.setMRT(
      mrt({
        output,
        bloomIntensity: float(0.1), // default bloom intensity
      }),
    );

    const outputPass = scenePass.getTextureNode();
    const bloomIntensityPass = scenePass.getTextureNode("bloomIntensity");
    const bloomPass = bloom(outputPass.mul(bloomIntensityPass), 1, 0, 0);
    const renderPipeline = new THREE.RenderPipeline(renderer);
    renderPipeline.outputColorTransform = false;
    renderPipeline.outputNode = outputPass.add(bloomPass).renderOutput();

    /**
     * Animate
     */
    // const clock = new THREE.Clock();

    function tick() {
      // const elapsedTime = clock.getElapsedTime();

      // Update controls
      controls.update();

      // Render
      renderPipeline.render();
      // composer.render();

      // Call tick again on the next frame
      // window.requestAnimationFrame(tick);
    }

    renderer.setAnimationLoop(tick);
  }, []);

  return <canvas id="canvas"></canvas>;
}
