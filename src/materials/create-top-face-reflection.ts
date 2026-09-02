import {
  ClampToEdgeWrapping,
  Color,
  Euler,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshStandardNodeMaterial,
  PerspectiveCamera,
  RenderTarget,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  Vector4,
  WebGPUCoordinateSystem,
  WebGPURenderer,
} from "three/webgpu";
import {
  and,
  dot,
  float,
  greaterThan,
  greaterThanEqual,
  lessThanEqual,
  max,
  mix,
  normalWorld,
  normalize,
  positionWorld,
  select,
  texture,
  uniform,
  vec2,
  vec4,
} from "three/tsl";
import { getShapeGeometry } from "../geometry";

const MAX_RT_EDGE = 2048;

type TopFaceReflectionOptions = {
  planePosition: { x: number; z: number; y: number };
  planeRotation: Euler;
  planeSize: { x: number; z: number };
  baseMaterial: MeshStandardNodeMaterial;
  lightDirection: Vector3;
  lightColor: Color;
  ambientIntensity: number;
  reflectivity?: number;
};

export function createTopFaceReflection(options: TopFaceReflectionOptions) {
  const reflectivity = options.reflectivity ?? 0.66;

  const textureMatrix = new Matrix4();
  const rotationMatrix = new Matrix4();
  const cameraWorldPosition = new Vector3();
  const planePoint = options.planePosition;
  const planeNormal = new Vector3(0, 1, 0);
  const view = new Vector3();
  const lookAtPosition = new Vector3();
  const target = new Vector3();
  const up = new Vector3();
  const savedClearColor = new Color();

  const virtualCamera = new PerspectiveCamera(45, 1, 0.1, 100);

  const renderTarget = new RenderTarget(1024, 1024, { samples: 4 });
  renderTarget.texture.colorSpace = SRGBColorSpace;
  renderTarget.texture.wrapS = ClampToEdgeWrapping;
  renderTarget.texture.wrapT = ClampToEdgeWrapping;
  renderTarget.texture.minFilter = LinearFilter;
  renderTarget.texture.magFilter = LinearFilter;
  const texelSize = new Vector2(1 / 1024, 1 / 1024);
  const texelSizeUniform = uniform(texelSize);

  const lightDirection = options.lightDirection.clone().normalize();
  const lightColorValue = options.lightColor.clone().multiplyScalar(0);
  const lightColor = new Vector3(lightColorValue.r, lightColorValue.g, lightColorValue.b);
  const ambientColor = new Vector3(1, 1, 1).multiplyScalar(options.ambientIntensity);
  const baseColorValue = options.baseMaterial.color;
  const baseColor = new Vector4(baseColorValue.r, baseColorValue.g, baseColorValue.b, 0.498);

  const textureMatrixUniform = uniform(textureMatrix);
  const baseColorUniform = uniform(baseColor);
  const lightDirectionUniform = uniform(lightDirection);
  const lightColorUniform = uniform(lightColor);
  const ambientColorUniform = uniform(ambientColor);
  const reflectivityUniform = uniform(reflectivity);

  const projCoord = textureMatrixUniform.mul(vec4(positionWorld, 1));
  const reflUv = projCoord.xy.div(projCoord.w);
  const inFront = greaterThan(projCoord.w, float(0));
  const inBounds = and(
    greaterThanEqual(reflUv.x, float(0)),
    lessThanEqual(reflUv.x, float(1)),
    greaterThanEqual(reflUv.y, float(0)),
    lessThanEqual(reflUv.y, float(1)),
  );

  const blurRadius = 5;
  const blurSigma = 16.5;
  const blurTaps: Array<[number, number, number]> = [];
  let blurWeightSum = 0;

  for (let offsetY = -blurRadius; offsetY <= blurRadius; offsetY++) {
    for (let offsetX = -blurRadius; offsetX <= blurRadius; offsetX++) {
      const weight = Math.exp(-(offsetX * offsetX + offsetY * offsetY) / (2 * blurSigma * blurSigma));
      blurTaps.push([offsetX, offsetY, weight]);
      blurWeightSum += weight;
    }
  }

  function samplePremultiplied(offsetX: number, offsetY: number, weight: number) {
    const tap = texture(renderTarget.texture, reflUv.add(vec2(offsetX, offsetY).mul(texelSizeUniform)));
    return tap.mul(weight / blurWeightSum);
  }

  let sampled = samplePremultiplied(blurTaps[0][0], blurTaps[0][1], blurTaps[0][2]);
  for (let i = 1; i < blurTaps.length; i++) {
    sampled = sampled.add(samplePremultiplied(blurTaps[i][0], blurTaps[i][1], blurTaps[i][2]));
  }

  const reflectionAlpha = sampled.w;
  const reflectionRgb = sampled.xyz.div(max(reflectionAlpha, float(1e-4)));
  const reflection = select(
    and(inFront, inBounds),
    vec4(reflectionRgb.x, reflectionRgb.y, reflectionRgb.z, reflectionAlpha),
    vec4(0, 0, 0, 0),
  );

  const worldNormal = normalize(normalWorld);
  const lightDir = normalize(lightDirectionUniform);
  const lambert = max(dot(worldNormal, lightDir), float(0));
  const base = baseColorUniform.xyz.mul(ambientColorUniform.add(lightColorUniform.mul(lambert)));

  const material = new MeshStandardNodeMaterial();
  material.copy(options.baseMaterial);
  material.transparent = true;
  material.colorNode = mix(base, reflection.xyz, reflection.w.mul(reflectivityUniform));
  material.opacityNode = baseColorUniform.w;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1;
  material.polygonOffsetUnits = -1;

  const planeGeometry = getShapeGeometry(options.planeSize.x * 0.99, options.planeSize.z * 0.99);
  const mesh = new Mesh(planeGeometry, material);
  mesh.rotateX(-Math.PI / 2);
  mesh.rotateZ(options.planeRotation.y);
  mesh.position.copy(planePoint);
  mesh.receiveShadow = true;

  function update(camera: PerspectiveCamera) {
    camera.updateMatrixWorld();

    virtualCamera.coordinateSystem = WebGPUCoordinateSystem;
    virtualCamera.fov = camera.fov;
    virtualCamera.aspect = camera.aspect;
    virtualCamera.near = camera.near;
    virtualCamera.far = camera.far;
    virtualCamera.updateProjectionMatrix();

    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    view.subVectors(planePoint, cameraWorldPosition);
    view.reflect(planeNormal).negate();
    view.add(planePoint);

    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition.set(0, 0, -1).applyMatrix4(rotationMatrix).add(cameraWorldPosition);

    target.subVectors(planePoint, lookAtPosition);
    target.reflect(planeNormal).negate();
    target.add(planePoint);

    up.set(0, 1, 0).applyMatrix4(rotationMatrix).reflect(planeNormal);

    virtualCamera.position.copy(view);
    virtualCamera.up.copy(up);
    virtualCamera.lookAt(target);
    virtualCamera.updateMatrixWorld();

    // WebGPU NDC: +Y is up in clip space, but the framebuffer origin is top-left,
    // so UV.y must be inverted relative to the classic WebGL bias matrix.
    const flipY = -0.5;
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, flipY, 0.0, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
  }

  function render(renderer: WebGPURenderer, mirrorScene: Scene) {
    const previousTarget = renderer.getRenderTarget();
    const previousShadowMap = renderer.shadowMap.enabled;
    const previousClearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(savedClearColor);

    renderer.shadowMap.enabled = false;
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.render(mirrorScene, virtualCamera);

    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(savedClearColor, previousClearAlpha);
    renderer.shadowMap.enabled = previousShadowMap;
  }

  function setSize(width: number, height: number) {
    const scale = Math.min(1, MAX_RT_EDGE / Math.max(width, height, 1));
    const rtWidth = Math.max(1, Math.round(width * scale));
    const rtHeight = Math.max(1, Math.round(height * scale));
    renderTarget.setSize(rtWidth, rtHeight);
    texelSize.set(1 / rtWidth, 1 / rtHeight);
  }

  function dispose() {
    material.dispose();
    planeGeometry.dispose();
    renderTarget.dispose();
  }

  return {
    material,
    mesh,
    renderTarget,
    virtualCamera,
    update,
    render,
    setSize,
    dispose,
  };
}
