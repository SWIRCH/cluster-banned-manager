import LogoImg from "@/assets/clusterbanned.png";
import { getGitHubLastRelease } from "@/lib/github";
import { config } from "@/utils/config";
import { openUrl } from "@/utils/openUrl";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Spinner } from "../ui/spinner";

export default function Logo({ baseUrl = config.BASE_URL, onlyImg = false }) {
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
      {
        threshold: 0.1,
        rootMargin: "50px 0px",
      },
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
      {/* Заменили motion.a на motion.div */}
      <motion.div className="logo inline-flex items-center gap-2">
        <motion.div
          className="relative flex items-center justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isHeroTextVisible && !onlyImg ? (
              <motion.div
                key="badge"
                variants={switchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="aura text-cyan-600 inline-flex items-center cursor-pointer"
                onClick={() => openUrl(`${config.GITHUB_URL}`)}
              >
                <HoverCard>
                  <HoverCardTrigger delay={100} closeDelay={200}>
                    <Badge>{loading ? <Spinner /> : lastVersion}</Badge>
                  </HoverCardTrigger>
                  <HoverCardContent>{versionName}</HoverCardContent>
                </HoverCard>
              </motion.div>
            ) : (
              <motion.a
                key="logo"
                href={baseUrl}
                variants={switchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="inline-flex items-center"
              >
                <img src={LogoImg.src} width="30" height="30" alt="Cluster Banned Logo" />
              </motion.a>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
