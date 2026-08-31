import { useTranslation, type Translations } from "@/hooks/useTranslation";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Marker, MarkerContent } from "./ui/marker";

interface BlockMarkerProps {
  title: keyof Translations;
  subtitle: keyof Translations;
}

export default function BlockMarker({ title, subtitle }: BlockMarkerProps) {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, {
    margin: "0px 0px -40% 0px",
    once: true,
  });

  const subtitleVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 40,
    },
    visible: {
      opacity: 0.2,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  return (
    <Marker variant="separator" className="relative">
      <MarkerContent>
        <div ref={ref} className="flex flex-col items-center justify-center gap-3">
          <motion.h3
            className="text-4xl absolute w-full -top-12.5 text-center font-light ia"
            variants={subtitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {t(subtitle)}
          </motion.h3>

          <h1 className="xl:text-5xl! md:text-3xl! text-center px-5">{t(title)}</h1>
        </div>
      </MarkerContent>
    </Marker>
  );
}
