import { useLayoutEffect, useState } from "react";

export function useElementHeight<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!el) {
      setHeight(0);
      return;
    }

    const update = () => {
      const next = el.offsetHeight;
      setHeight((prev) => (prev === next ? prev : next));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);

  return [setEl, height] as const;
}
