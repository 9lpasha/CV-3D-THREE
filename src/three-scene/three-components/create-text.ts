import { FontLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three/webgpu";

import fontUrl from "../../assets/helvetiker_regular.typeface.json?url";
import { quality } from "../../constants/quality";
import { getSize } from "../../helpers";

type ScreenFont = {
  data: {
    glyphs: Record<string, { ha: number }>;
    resolution: number;
  };
  generateShapes: (text: string, size: number) => THREE.Shape[];
};

export type ScreenTextController = {
  reveal: (count: number) => void;
  isComplete: () => boolean;
};

export const SCREEN_JSON = `{
  "id": 101,
  "type": "user",
  "name": "Alice",
  "role": "admin",
  "active": "true"
}`;

const FONT_SIZE = 0.05;
const LETTER_SPACING = 0.015;
const LINE_HEIGHT = 0.1;

const placeText = (object: THREE.Object3D, mesh: THREE.Mesh, size: THREE.Vector3) => {
  const { position, rotation } = mesh;
  object.position.set(
    position.x - 0.25 * size.x * Math.cos(rotation.y),
    position.y + size.y * 0.25,
    position.z + 0.25 * size.x * Math.sin(rotation.y) + 0.05,
  );
  object.rotation.set(rotation.x, rotation.y, rotation.z);
};

const forEachGlyph = (font: ScreenFont, visit: (char: string, x: number, y: number, index: number) => void) => {
  let x = 0;
  let y = 0;

  for (let index = 0; index < SCREEN_JSON.length; index++) {
    const char = SCREEN_JSON[index];

    if (char === "\n") {
      x = 0;
      y -= LINE_HEIGHT;
      continue;
    }

    const glyph = font.data.glyphs[char];

    if (!glyph) {
      x += FONT_SIZE * 0.5;
      continue;
    }

    if (char !== " ") {
      visit(char, x, y, index);
    }

    x += (glyph.ha / font.data.resolution) * FONT_SIZE + LETTER_SPACING;
  }
};

const createCanvasText = (
  scene: THREE.Scene,
  mesh: THREE.Mesh,
  font: ScreenFont,
  progressive: boolean,
): ScreenTextController => {
  const size = getSize(mesh);
  const chars: { char: string; x: number; y: number; index: number }[] = [];
  let maxX = 0;
  let minY = 0;

  forEachGlyph(font, (char, x, y, index) => {
    chars.push({ char, x, y, index });
    maxX = Math.max(maxX, x + (font.data.glyphs[char].ha / font.data.resolution) * FONT_SIZE);
    minY = Math.min(minY, y);
  });

  const width = Math.max(maxX, FONT_SIZE);
  const height = FONT_SIZE - minY;
  const px = 1024 / width;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.max(1, Math.round(height * px));
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.premultiplyAlpha = false;

  let visibleCount = progressive ? 0 : SCREEN_JSON.length;

  const paint = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4aff7f";
    ctx.font = `700 ${FONT_SIZE * px}px Helvetica, Arial, sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    for (const glyph of chars) {
      if (glyph.index >= visibleCount) continue;
      ctx.fillText(glyph.char, glyph.x * px, (FONT_SIZE - glyph.y) * px);
    }

    map.needsUpdate = true;
  };

  paint();

  const geometry = new THREE.PlaneGeometry(width, height);
  geometry.translate(width / 2, (FONT_SIZE + minY) / 2, 0);

  const plane = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  plane.castShadow = false;
  plane.receiveShadow = false;
  placeText(plane, mesh, size);
  scene.add(plane);

  return {
    reveal: (count: number) => {
      visibleCount = Math.min(SCREEN_JSON.length, visibleCount + count);
      paint();
    },
    isComplete: () => visibleCount >= SCREEN_JSON.length,
  };
};

const createVectorText = (
  scene: THREE.Scene,
  mesh: THREE.Mesh,
  font: ScreenFont,
  progressive: boolean,
): ScreenTextController => {
  const size = getSize(mesh);
  const material = new THREE.MeshBasicMaterial({
    color: 0x4aff7f,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const group = new THREE.Group();
  const charMeshes: { mesh: THREE.Mesh; index: number }[] = [];
  let visibleCount = progressive ? 0 : SCREEN_JSON.length;

  forEachGlyph(font, (char, x, y, index) => {
    const shapes = font.generateShapes(char, FONT_SIZE);
    const geometry = new THREE.ShapeGeometry(shapes);
    const charMesh = new THREE.Mesh(geometry, material);
    charMesh.castShadow = false;
    charMesh.receiveShadow = false;
    charMesh.position.set(x, y, 0);
    charMesh.visible = index < visibleCount;
    group.add(charMesh);
    charMeshes.push({ mesh: charMesh, index });
  });

  placeText(group, mesh, size);
  scene.add(group);

  return {
    reveal: (count: number) => {
      visibleCount = Math.min(SCREEN_JSON.length, visibleCount + count);
      for (const item of charMeshes) {
        item.mesh.visible = item.index < visibleCount;
      }
    },
    isComplete: () => visibleCount >= SCREEN_JSON.length,
  };
};

export const packetCharCounts = () => {
  const chunks: number[] = [];
  let left = SCREEN_JSON.length;

  while (left > 0) {
    const n = left <= 3 ? left : Math.random() < 0.5 ? 2 : 3;
    chunks.push(n);
    left -= n;
  }

  return chunks;
};

export const createText = (scene: THREE.Scene, mesh: THREE.Mesh, options: { progressive?: boolean } = {}) => {
  const progressive = options.progressive === true;
  const loader = new FontLoader();

  return new Promise<ScreenTextController>((resolve) => {
    loader.load(
      fontUrl,
      (font) => {
        const controller = quality.canvasText
          ? createCanvasText(scene, mesh, font, progressive)
          : createVectorText(scene, mesh, font, progressive);
        resolve(controller);
      },
      undefined,
      () =>
        resolve({
          reveal: () => undefined,
          isComplete: () => true,
        }),
    );
  });
};
