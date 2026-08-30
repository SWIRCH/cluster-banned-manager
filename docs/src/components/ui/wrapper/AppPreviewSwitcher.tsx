import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { activePlatform } from "@/stores/platform";

export default function AppPreviewSwitcher() {
  const active = useStore(activePlatform);

  useEffect(() => {
    const wrappers = document.querySelectorAll<HTMLElement>(".app-hero__body__image [data-platform]");
    wrappers.forEach((el) => {
      const isActive = el.dataset.platform === active;
      el.style.opacity = isActive ? "1" : "0";
      el.style.pointerEvents = isActive ? "auto" : "none";
    });
  }, [active]);

  return null;
}
