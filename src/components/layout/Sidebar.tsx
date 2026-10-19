import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import type { Game, Region } from "@/types/cluster";
import { Menu, MenuButton } from "@headlessui/react";
import { cn } from "cn";
import { motion } from "framer-motion";
import { Ban, Ellipsis, LucideIcon, RefreshCcw, Settings2 } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import MoreDropdownMenu from "../features/MoreDropdownMenu";

type SidebarProps = {
  game: Game;
  selectedRegion: Region | null;
  onRegionChange: (regionId: string) => void;
  onCheckHosts: () => void;
  onSettingsClick: () => void;
  onRefreshClick: () => void;
  onClearClick: () => void;
  onOtherClick?: () => void;
};

type NavigateItemType = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

const iconVariants = {
  idle: { scale: 1, y: 0 },
  active: { scale: 1.1, y: -2 },
};

export default memo(function Sidebar({
  game,
  selectedRegion,
  onRegionChange,
  // onCheckHosts,
  onSettingsClick,
  onRefreshClick,
  onClearClick,
  onOtherClick,
}: SidebarProps) {
  const { t } = useTranslation();
  const setIsAboutModalOpen = useAppStore((s) => s.setIsAboutModalOpen);

  const navList: NavigateItemType[] = [
    {
      label: t("sidebar.settings"),
      icon: Settings2,
      onClick: () => onSettingsClick(),
    },
    // {
    //   label: t("sidebar.check_status"),
    //   icon: SearchAlert,
    //   onClick: () => onCheckHosts(),
    // },
    {
      label: t("sidebar.clear_blocks"),
      icon: Ban,
      onClick: () => onClearClick(),
    },
    {
      label: t("sidebar.refresh"),
      icon: RefreshCcw,
      onClick: () => onRefreshClick(),
    },
  ];

  const tooltipClass = cn("text-sm");

  return (
    <div className="sidebar z-(--z-sidebar)!">
      <TooltipProvider delay={50} closeDelay={300}>
        <div className="flex flex-col items-center w-16 h-full overflow-hidden text-gray-400 rounded">
          <Tooltip>
            <TooltipTrigger>
              <a
                className="flex items-center justify-center mt-4 mb-1"
                href="#"
              >
                <img src="/clusterbanned.png" width={30} height={30} />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className={tooltipClass}>
              <p>ClusterBannedManager (◕‿‿◕)</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex flex-col items-center mt-3 mb-3">
            <hr className="hr-bordered-top" />

            <div className="link-items mt-4">
              {game.regions.map((region) => (
                <Tooltip key={region.id}>
                  <TooltipTrigger>
                    <a href="#" className="link-item">
                      <div
                        className={`dropdownInteractiveItem flex items-center gap-2 
                          ${region.id === selectedRegion?.id ? "active" : ""}`}
                        onClick={() => onRegionChange(region.id)}
                      >
                        <img
                          width={30}
                          height={30}
                          src={region.icon}
                          className={
                            region.id === selectedRegion?.id
                              ? "rounded-full"
                              : ""
                          }
                        />

                        {region.alias_name !== "RU" && (
                          <img
                            width={30}
                            height={30}
                            src={region.flag_icon ?? ""}
                            className="absolute flag-icon right-0 bottom-0"
                          />
                        )}
                      </div>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={tooltipClass}>
                    <p>{t(region?.name_key as any)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Навигационные кнопки */}
          <div className="flex flex-col items-center mt-2">
            <hr className="hr-bordered-top" />

            {navList.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger>
                  <a
                    className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
                    href="#"
                    onClick={item.onClick}
                  >
                    <item.icon />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" className={tooltipClass}>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Другое: кнопка с дропдауном */}
          <Menu as="div" className="relative flex justify-center mt-2">
            <Tooltip>
              <TooltipTrigger>
                <MenuButton
                  type="button"
                  className="flex items-center justify-center font-medium px-2 py-2 transition-colors group select-none rounded-full focus:outline-none hover:bg-gray-700 hover:text-gray-300"
                  onClick={() => onOtherClick?.()}
                >
                  <motion.div variants={iconVariants} animate="idle">
                    <Ellipsis className="text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                  </motion.div>
                </MenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className={tooltipClass}>
                <p>{t("sidebar.other")}</p>
              </TooltipContent>
            </Tooltip>

            <MoreDropdownMenu onAboutModal={setIsAboutModalOpen} />
          </Menu>
        </div>
      </TooltipProvider>
    </div>
  );
});
