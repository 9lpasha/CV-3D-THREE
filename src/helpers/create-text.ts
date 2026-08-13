import { FontLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three/webgpu";

import font from "../assets/helvetiker_regular.typeface.json?url";

export const createText = (scene: THREE.Scene, position: THREE.Vector3, rotation: THREE.Euler) => {
  const loader = new FontLoader();

  loader.load(font, (font) => {
    const color = 0x4aff7f;

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const message = `{
  "id": 101,
  "type": "user",
  "name": "Alice",
  "role": "admin",
  "active": "true"
}`;

    const fontSize = 0.05;
    const letterSpacing = 0.015;
    const lineHeight = 0.1;

    const group = new THREE.Group();

    let x = 0;
    let y = 0;

    for (const char of message) {
      // Новая строка
      if (char === "\n") {
        x = 0;
        y -= lineHeight;
        continue;
      }

      // Получаем glyph
      const glyph = font.data.glyphs[char];

      // Если glyph отсутствует
      if (!glyph) {
        x += fontSize * 0.5;
        continue;
      }

      // Пробел
      if (char === " ") {
        x += (glyph.ha / font.data.resolution) * fontSize;
        x += letterSpacing;
        continue;
      }

      const shapes = font.generateShapes(char, fontSize);

      const geometry = new THREE.ShapeGeometry(shapes);

      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, y, 0);

      group.add(mesh);

      // Реальная ширина glyph
      const advance = (glyph.ha / font.data.resolution) * fontSize;

      x += advance + letterSpacing;
    }

    group.position.set(position.x - 1, position.y + 1.24, position.z + 0.14);

    group.rotation.set(rotation.x, rotation.y + 0.77, rotation.z);

    scene.add(group);
  });
};
