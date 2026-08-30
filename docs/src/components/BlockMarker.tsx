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

  // 1. Создаем реф для отслеживания элемента
  const ref = useRef<HTMLDivElement>(null);

  // 2. Настраиваем триггер видимости.
  // "0px 0px -30% 0px" означает: триггер сработает, когда элемент поднимется на 30% снизу экрана.
  // once: true заставит анимацию проиграться только один раз. Если нужно крутить её туда-обратно, уберите этот параметр.
  const isInView = useInView(ref, {
    margin: "0px 0px -40% 0px",
    once: true,
  });

  // 3. Описываем варианты анимации (Variants) для Framer Motion
  const subtitleVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 40, // Начальная позиция: смещен вниз на 40px
    },
    visible: {
      opacity: 0.2, // Ваша исходная прозрачность h3
      y: 0, // Возвращается на свое место
      transition: {
        duration: 0.6, // Длительность анимации
        ease: [0.215, 0.61, 0.355, 1.0], // Красивый кубический bezier (easeOutCubic)
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
