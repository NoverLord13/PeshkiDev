import { useEffect, useState } from "react";

/**
 * True for phones/tablets where we should show touch minimap chrome (dismiss, expand).
 * Some Android browsers wrongly report (hover: hover); we combine media queries and touch capability.
 */
const computeCoarsePointerUi = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return true;
    }
    if (window.matchMedia("(any-pointer: coarse)").matches) {
      return true;
    }
    if (window.matchMedia("(hover: none)").matches) {
      return true;
    }
    if (window.matchMedia("(any-hover: none)").matches) {
      return true;
    }
  } catch {
    /* matchMedia unavailable */
  }

  const touchPoints = typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) : 0;
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  return touchPoints > 0 && minSide <= 1024;
};

export const useCoarsePointerUi = () => {
  const [coarsePointerUi, setCoarsePointerUi] = useState(computeCoarsePointerUi);

  useEffect(() => {
    const sync = () => setCoarsePointerUi(computeCoarsePointerUi());
    const queries = [
      "(pointer: coarse)",
      "(any-pointer: coarse)",
      "(hover: none)",
      "(any-hover: none)",
    ].map((q) => window.matchMedia(q));

    queries.forEach((mq) => mq.addEventListener("change", sync));
    window.addEventListener("resize", sync);
    sync();

    return () => {
      queries.forEach((mq) => mq.removeEventListener("change", sync));
      window.removeEventListener("resize", sync);
    };
  }, []);

  return coarsePointerUi;
};
