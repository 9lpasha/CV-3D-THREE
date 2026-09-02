const hasCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const isSmallViewport = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 900;
const isMobileUa = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export const isMobile = isMobileUa || (hasCoarsePointer && isSmallViewport);

export const quality = isMobile
  ? {
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      shadows: false,
      shadowMapSize: 512,
      bloom: false,
      reflections: false,
      particleCount: 480,
      cubeCount: 4,
      cubeTextureSize: 64,
      cubeCastShadow: false,
      modelCastShadow: false,
      canvasText: true,
      floorSegments: 24,
      gridDivisions: 16,
      platformRadiusSegments: 1,
      screenPointLights: 2,
      antennaPointLights: 1,
    }
  : {
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      shadows: false,
      shadowMapSize: 2048,
      bloom: true,
      reflections: true,
      particleCount: 420,
      cubeCount: 8,
      cubeTextureSize: 256,
      cubeCastShadow: true,
      modelCastShadow: true,
      canvasText: false,
      floorSegments: 64,
      gridDivisions: 32,
      platformRadiusSegments: 4,
      screenPointLights: 9,
      antennaPointLights: 4,
    };
