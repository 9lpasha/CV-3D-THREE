import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as THREE from "three/webgpu";
import { quality } from "../constants/quality";
import { lights } from "three/tsl";

export const createBaseScene = (canvas: HTMLCanvasElement) => {
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
  // controls.minPolarAngle = Math.PI / 2 - 0.4;
  // controls.maxPolarAngle = Math.PI / 2 - 0.4;

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

  return { scene, camera, renderer, controls, mainLightsNode, ambientLight, light };
};
