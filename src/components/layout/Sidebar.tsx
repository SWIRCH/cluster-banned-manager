import type { Game, Region } from "@/types/cluster";
import { Ban, LucideIcon, RefreshCcw, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "react-tooltip";

type SidebarProps = {
  game: Game;
  selectedRegion: Region | null;
  onRegionChange: (regionId: string) => void;
  onCheckHosts: () => void;
  onSettingsClick: () => void;
  onRefreshClick: () => void;
  onClearClick: () => void;
};

type NavigateItemType = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

export default function Sidebar({
  game,
  selectedRegion,
  onRegionChange,
  // onCheckHosts,
  onSettingsClick,
  onRefreshClick,
  onClearClick,
}: SidebarProps) {
  const { t } = useTranslation();

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

  return (
    <div className="sidebar">
      <div className="flex flex-col items-center w-16 h-full overflow-hidden text-gray-400 rounded">
        <a
          className="flex items-center justify-center mt-4 mb-1"
          href="#"
          data-tooltip-id="sidebar-tooltips"
          data-tooltip-content="ClusterBannedManager (◕‿‿◕)"
        >
          <img src="/clusterbanned.png" width={30} height={30} />
        </a>
        <div className="flex flex-col items-center mt-3 mb-3">
          <hr className="hr-bordered-top" />

          <div className="link-items mt-4">
            {game.regions.map((region) => (
              <a href="#" key={region.id} className="link-item">
                <div
                  className={`dropdownInteractiveItem flex items-center gap-2 
                    ${region.id === selectedRegion?.id ? "active" : ""}`}
                  onClick={() => onRegionChange(region.id)}
                  data-tooltip-id="sidebar-tooltips"
                  data-tooltip-content={t(region?.name_key as any)}
                >
                  <img
                    width={30}
                    height={30}
                    src={region.icon}
                    className={
                      region.id === selectedRegion?.id ? "rounded-full" : ""
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
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <hr className="hr-bordered-top" />

          {navList.map((item) => (
            <a
              key={item.label}
              className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
              href="#"
              data-tooltip-id="sidebar-tooltips"
              data-tooltip-content={item.label}
              onClick={item.onClick}
            >
              <item.icon />
            </a>
          ))}
        </div>
      </div>

      <Tooltip
        id="sidebar-tooltips"
        style={{ backgroundColor: "rgb(22 26 30 / 53%)", color: "#fff" }}
        noArrow={true}
        place="right"
      />
    </div>
  );
}
