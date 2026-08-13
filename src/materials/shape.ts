import * as THREE from "three/webgpu";

export const getShapeGeometry = (width: number, height: number) => {
  const shape = new THREE.Shape();

  const radius = 0.14;

  shape.moveTo(-width / 2 + radius, -height / 2);

  shape.lineTo(width / 2 - radius, -height / 2);

  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);

  shape.lineTo(width / 2, height / 2 - radius);

  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);

  shape.lineTo(-width / 2 + radius, height / 2);

  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);

  shape.lineTo(-width / 2, -height / 2 + radius);

  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

  return new THREE.ShapeGeometry(shape);
};
