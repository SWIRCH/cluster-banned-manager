import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Badge } from "../ui/badge";
import { getGitHubLastRelease } from "@/lib/github";
import { Spinner } from "../ui/spinner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export default function Logo({ baseUrl = "/" }) {
  const [isHeroTextVisible, setIsHeroTextVisible] = useState(true);
  const [lastVersion, setLastVersion] = useState<string | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const targetElement = document.querySelector(".app-hero__body__text-content");
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsHeroTextVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(targetElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadRelease = async () => {
      try {
        const data = await getGitHubLastRelease();
        setLastVersion(data?.tag_name ?? "0.0.0");
        setVersionName(data?.name ?? "ClusterBanned");
      } catch (error) {
        console.error("Failed to load release:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRelease();
  }, []);

  const switchVariants: Variants = {
    initial: {
      width: "fit-content",
      opacity: 0,
      scale: 0.6,
      y: -8,
      rotateX: -30,
    },
    animate: {
      width: "auto",
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
      },
    },
    exit: {
      width: "auto",
      opacity: 0,
      scale: 0.6,
      y: 8,
      rotateX: 30,
      transition: { duration: 0.12 },
    },
  };

  return (
    <div className="flex shrink-0 items-center gap-3">
      <motion.a layout href={baseUrl} className="inline-flex items-center gap-2">
        <motion.div
          layout
          className="relative flex items-center justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isHeroTextVisible ? (
              <motion.div
                key="badge"
                variants={switchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="aura text-cyan-600 inline-flex items-center"
              >
                <HoverCard>
                  <HoverCardTrigger delay={100} closeDelay={200}>
                    <Badge>{loading ? <Spinner /> : lastVersion}</Badge>
                  </HoverCardTrigger>
                  <HoverCardContent>{versionName}</HoverCardContent>
                </HoverCard>
              </motion.div>
            ) : (
              <motion.div
                key="logo"
                variants={switchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="inline-flex items-center"
              >
                <img
                  src="/cluster-banned-manager/img/clusterbanned.png"
                  width="30"
                  height="30"
                  alt="Cluster Banned Logo"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.a>
    </div>
  );
}
