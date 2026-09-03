import { useRef } from "react";

type SceneToggles = {
  setReflections: (enabled: boolean) => void;
};

export const useMenuToggle = () => {
  const sceneToggles = useRef<SceneToggles | null>(null);

  return sceneToggles;
};
