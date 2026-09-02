import { useAppStore } from "@/store/useAppStore"
import { openGithub } from "@/utils/opener"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { motion, Variants } from "framer-motion"
import {
  CircleEllipsis,
  Code,
  Github,
  RefreshCcw,
  Settings2,
} from "lucide-react"
import { useState } from "react"

type BottomBarProps = {
  onSettingsClick: () => void;
  onRefreshClick: () => void;
  onOtherClick?: () => void;
};

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
  const { setIsAboutModalOpen } = useAppStore();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleButtonClick = (key: string, callback?: () => void) => {
    setActiveKey(key);
    if (callback) callback();
    setTimeout(() => setActiveKey(null), 400);
  };

  return (
    <div className="mobile-bottom-bar">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="sticky bottom-0 left-0 z-50 w-full h-16"
      >
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
          {/* Кнопка: Настройки */}
          <button
            type="button"
            className="inline-flex flex-col items-center justify-center font-medium px-5 transition-colors group select-none"
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
            className="inline-flex flex-col items-center justify-center font-medium px-5 transition-colors group select-none"
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

          {/* Кнопка с Дропдауном: Другое */}
          <Menu as="div" className="relative flex justify-center h-full">
            <MenuButton
              type="button"
              className="inline-flex flex-col items-center justify-center w-full font-medium px-5 transition-colors  group select-none focus:outline-none"
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
            </MenuButton>

            <MenuItems
              transition
              anchor="top end"
              className="w-52 origin-bottom-right rounded-xl border border-white/10 bg-neutral-900/95 p-1 text-sm/6 text-white backdrop-blur-md shadow-2xl transition duration-100 ease-out [--anchor-gap:12px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
            >
              <MenuItem>
                <button
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
                  onClick={openGithub}
                >
                  <Github className="size-4 text-white/30" />
                  GitHub
                </button>
              </MenuItem>

              <div className="my-1 h-px bg-white/10" />

              <MenuItem>
                <button
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
                  onClick={() => setIsAboutModalOpen(true)}
                >
                  <Code className="size-4 text-white/30" />О приложении
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </motion.div>
    </div>
  );
}
