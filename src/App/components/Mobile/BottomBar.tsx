import { useState } from "react";
import { CircleEllipsis, RefreshCcw, Settings2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

type BottomBarProps = {
  onSettingsClick: () => void;
  onRefreshClick: () => void;
  onOtherClick?: () => void;
};

// Варианты анимации для выпрыгивания и поворота иконки
const iconVariants: Variants = {
  idle: { y: 0, rotate: 0, scale: 1 },
  active: {
    y: [-2, -8, 0],
    rotate: [0, -12, 8, 0],
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function MobileBottomBar({
  onSettingsClick,
  onRefreshClick,
  onOtherClick,
}: BottomBarProps) {
  // Трекинг нажатых кнопок для перезапуска анимации
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleButtonClick = (key: string, callback?: () => void) => {
    setActiveKey(key);
    if (callback) callback();
    // Сбрасываем активный ключ после завершения анимации
    setTimeout(() => setActiveKey(null), 400);
  };

  return (
    <div className="mobile-bottom-bar">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="sticky bottom-0 left-0 z-1000 w-full h-16 backdrop-blur-md"
      >
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
          {/* Кнопка: Настройки */}
          <button
            type="button"
            className="inline-flex flex-col items-center justify-center font-medium px-5 transition-colors hover:bg-neutral-800/50 group select-none"
            onClick={() => handleButtonClick("settings", onSettingsClick)}
          >
            <motion.div
              variants={iconVariants}
              animate={activeKey === "settings" ? "active" : "idle"}
            >
              <Settings2 className="mb-1 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
            </motion.div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-100 transition-colors">
              Настройки
            </span>
          </button>

          {/* Кнопка: Обновить */}
          <button
            type="button"
            className="inline-flex flex-col items-center justify-center font-medium px-5 transition-colors hover:bg-neutral-800/50 group select-none"
            onClick={() => handleButtonClick("refresh", onRefreshClick)}
          >
            <motion.div
              variants={iconVariants}
              animate={activeKey === "refresh" ? "active" : "idle"}
            >
              <RefreshCcw className="mb-1 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
            </motion.div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-100 transition-colors">
              Обновить
            </span>
          </button>

          {/* Кнопка: Другое */}
          <button
            type="button"
            className="inline-flex flex-col items-center justify-center font-medium px-5 transition-colors hover:bg-neutral-800/50 group select-none"
            onClick={() => handleButtonClick("other", onOtherClick)}
          >
            <motion.div
              variants={iconVariants}
              animate={activeKey === "other" ? "active" : "idle"}
            >
              <CircleEllipsis className="mb-1 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
            </motion.div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-100 transition-colors">
              Другое
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
