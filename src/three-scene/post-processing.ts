import { float, mrt, output, pass } from "three/tsl";
import * as THREE from "three/webgpu";
import { quality } from "../constants/quality";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";

export const createPostProcessing = (
  scene: THREE.Object3D<THREE.Object3DEventMap>,
  camera: THREE.Camera,
  renderer: THREE.WebGPURenderer,
) => {
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

  return { renderFrame, compileFrame };
};
