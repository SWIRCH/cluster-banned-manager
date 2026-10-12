import { useEffect, useRef, useState } from "react";

export function useOverflowScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);

    // наблюдаем за всеми детьми (и добавляем новых через MutationObserver)
    const mo = new MutationObserver(() => {
      // переподписываемся на новых детей
      ro.disconnect();
      ro.observe(el);
      Array.from(el.children).forEach((child) => ro.observe(child));
      check();
    });
    mo.observe(el, { childList: true, subtree: true });

    Array.from(el.children).forEach((child) => ro.observe(child));

    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  return { ref, hasOverflow };
}
