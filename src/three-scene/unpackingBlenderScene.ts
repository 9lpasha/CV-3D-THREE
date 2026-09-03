import * as THREE from "three/webgpu";
import { BLUE_METALLIC_COLOR } from "../constants/colors";
import { getSize } from "../helpers";
import { quality } from "../constants/quality";
import { addAntenaPointLight, addScreenPointLight } from "./three-components/lights";
import { createText } from "./three-components";
import type { ScreenTextController } from "./three-components";
import { createPlatformReflections } from "./reflections";

export const unpackingBlenderScene = async (
  scene: THREE.Scene,
  model: THREE.Group<THREE.Object3DEventMap>,
  mainLightsNode: THREE.LightsNode,
  light: THREE.Light,
  ambientLight: THREE.AmbientLight,
) => {
  let serverGreenJson: THREE.Mesh | undefined;
  let serverGreenJsonText: THREE.Mesh | undefined;
  let greenJson: THREE.Mesh | undefined;
  let greenJsonText: THREE.Mesh | undefined;
  let routerPlatform: THREE.Mesh | undefined;
  let routerPlatformLights: THREE.Mesh | undefined;
  let screenJson: THREE.Mesh | undefined;
  let screenJsonDark: THREE.Mesh | undefined;
  let machine: THREE.Mesh | undefined;
  let machineLights: THREE.Mesh | undefined;
  let clientPlatform: THREE.Mesh | undefined;
  let networkPlatform: THREE.Mesh | undefined;
  let serverPlatform: THREE.Mesh | undefined;
  let screenTextPromise: Promise<ScreenTextController> | undefined;

  const textJobs: Promise<unknown>[] = [];
  const reflections: ReturnType<typeof createPlatformReflections> = [];

  model.traverse((child) => {
    child.castShadow = quality.modelCastShadow || child.name.includes("Platform");
    child.receiveShadow = quality.modelCastShadow;

    // сохранение ссылок на основные объекты
    if (child.name === "ClientPlatform") {
      clientPlatform = child as THREE.Mesh;
    } else if (child.name === "ServerPlatform") {
      serverPlatform = child as THREE.Mesh;
    } else if (child.name === "NetworkPlatform") {
      networkPlatform = child as THREE.Mesh;
    } else if (child.name === "Machine") {
      machine = child as THREE.Mesh;
    } else if (child.name === "MachineLights") {
      machineLights = child as THREE.Mesh;
    } else if (child.name === "ScreenJson") {
      screenJson = child as THREE.Mesh;
    } else if (child.name === "ScreenJsonDark") {
      screenJsonDark = child as THREE.Mesh;
    } else if (child.name === "ServerGreenJson") {
      serverGreenJson = child as THREE.Mesh;
    } else if (child.name === "ServerGreenJsonText") {
      serverGreenJsonText = child as THREE.Mesh;
    } else if (child.name === "GreenJson") {
      greenJson = child as THREE.Mesh;
    } else if (child.name === "GreenJsonText") {
      greenJsonText = child as THREE.Mesh;
    } else if (child.name === "RouterPlatform") {
      routerPlatform = child as THREE.Mesh;
    } else if (child.name === "RouterPlatformLights") {
      routerPlatformLights = child as THREE.Mesh;
    }

    if (child.type !== "Mesh") return;

    const mesh = child as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;

    material.emissiveIntensity = 0;

    if (material.name === "BlueMetallic") {
      material.color = new THREE.Color(BLUE_METALLIC_COLOR);
    }

    if (material.name === "BlueMetallicDark") {
      mesh.material = new THREE.MeshStandardNodeMaterial({
        ...material,
        roughness: 0.7,
      });
    }

    // интенсивность свечения
    if (material.name === "WhiteText") {
      material.emissiveIntensity = 0;
    } else if (material.name === "GreenGlow") {
      material.emissiveIntensity = 0.3;
    } else if (material.name === "GreenText") {
      material.emissiveIntensity = 2;
    } else if (material.name === "Green") {
      material.emissiveIntensity = 0.01;
    } else if (mesh.name.includes("Button")) {
      material.emissiveIntensity = 0;
    }

    if (mesh.name === "ClientPlatform" || mesh.name === "ServerPlatform" || mesh.name === "NetworkPlatform") {
      mesh.receiveShadow = false;
      mesh.castShadow = false;

      mesh.material = new THREE.MeshStandardMaterial({
        ...material,
        color: new THREE.Color(BLUE_METALLIC_COLOR),
        roughness: 0.7,
      });
    } else if (mesh.name === "ScreenJson") {
      screenTextPromise = new Promise<ScreenTextController>((resolve) => {
        textJobs.push(
          createText(scene, mesh, { progressive: true }).then((controller) => {
            resolve(controller);
          }),
        );
      });
    } else if (mesh.name === "ServerScreen") {
      const size = getSize(mesh);
      const pointLight = new THREE.PointLight(0x00ff00, 0.4, 1);
      pointLight.position.set(
        mesh.position.x - (size.x / 2 - 0.3),
        mesh.position.y - size.y / 2 + 0.2,
        mesh.position.z + 0.5,
      );
      scene.add(pointLight);

      textJobs.push(createText(scene, mesh));
    } else if (mesh.name === "Antena" && quality.antennaPointLights > 1) {
      const pointLight = new THREE.PointLight(0x00ffff, 2, 1.2);
      const size = getSize(mesh);
      pointLight.position.set(mesh.position.x, mesh.position.y + size.y + 0.3, mesh.position.z - 0.3);
      scene.add(pointLight);
    }

    if (material.name === "BlueMetallic") {
      mesh.material = new THREE.MeshStandardNodeMaterial({
        ...material,
        color: new THREE.Color(BLUE_METALLIC_COLOR),
        roughness: 0.8,
      });
    }

    if (mesh.name === "GreenJson" || mesh.name === "ServerGreenJson") {
      mesh.material = new THREE.MeshStandardNodeMaterial({
        ...material,
        lightsNode: mainLightsNode,
        roughness: 0.7,
      });
    }

    if (mesh.name === "NetworkPlatform") {
      const size = getSize(mesh);
      const pointLight = new THREE.PointLight(0x00ffff, 1, 1);
      pointLight.position.set(mesh.position.x + size.x / 2 + 0.5, mesh.position.y, mesh.position.z + size.z / 2 + 0.5);
      scene.add(pointLight);

      mesh.material = new THREE.MeshStandardNodeMaterial({
        ...material,
        color: new THREE.Color(BLUE_METALLIC_COLOR),
        roughness: 0.7,
      });
    }

    // дополнительные точки света
    if (mesh.name.includes("Screen")) {
      addScreenPointLight(scene, mesh, mesh.name === "ScreenJson");
    }
    if (mesh.name.includes("Antena")) {
      addAntenaPointLight(scene, mesh);
    }
  });

  if (quality.reflections) {
    reflections.push(
      ...createPlatformReflections(
        scene,
        [clientPlatform, serverPlatform, networkPlatform],
        mainLightsNode,
        light,
        ambientLight,
      ),
    );
  }

  return {
    serverGreenJson: serverGreenJson as THREE.Mesh,
    serverGreenJsonText: serverGreenJsonText as THREE.Mesh,
    greenJson: greenJson as THREE.Mesh,
    greenJsonText: greenJsonText as THREE.Mesh,
    routerPlatform: routerPlatform as THREE.Mesh,
    routerPlatformLights: routerPlatformLights as THREE.Mesh,
    screenJson: screenJson as THREE.Mesh,
    screenJsonDark: screenJsonDark as THREE.Mesh,
    machine: machine as THREE.Mesh,
    machineLights: machineLights as THREE.Mesh,
    clientPlatform: clientPlatform as THREE.Mesh,
    networkPlatform: networkPlatform as THREE.Mesh,
    serverPlatform: serverPlatform as THREE.Mesh,
    screenText: await screenTextPromise,
    textJobs,
    reflections,
  };
};
