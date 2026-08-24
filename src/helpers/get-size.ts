import * as THREE from "three/webgpu";

export const getSize = (mesh: THREE.Mesh) => {
  // 1. Клонируем геометрию, чтобы не сломать оригинал
  const geom = mesh.geometry.clone();

  // 2. Применяем к геометрии ТОЛЬКО масштаб, но НЕ поворот и НЕ позицию
  // (Это избавит нас от искажений AABB)
  geom.applyMatrix4(new THREE.Matrix4().makeScale(mesh.scale.x, mesh.scale.y, mesh.scale.z));

  // 3. Вычисляем бокс
  geom.computeBoundingBox();
  const box = geom.boundingBox as THREE.Box3;

  // 4. Получаем размеры (это будет реальная ширина/высота/глубина объекта)
  const size = new THREE.Vector3();
  box.getSize(size);

  return size;
};
