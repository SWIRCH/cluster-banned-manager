import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth < breakpoint ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < breakpoint ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}
