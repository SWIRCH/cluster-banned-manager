import { Ban, RefreshCcw, SearchAlert, Settings2 } from "lucide-react";
import type { Game, Region } from "../../types/cluster";
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

export default function Sidebar({
  game,
  selectedRegion,
  onRegionChange,
  onCheckHosts,
  onSettingsClick,
  onRefreshClick,
  onClearClick,
}: SidebarProps) {
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
                  data-tooltip-content={region?.name}
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
                  {/* <span>{region.name}</span> */}
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <hr className="hr-bordered-top" />

          <a
            className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
            href="#"
            data-tooltip-id="sidebar-tooltips"
            data-tooltip-content="Проверить статус"
            onClick={onCheckHosts}
          >
            <SearchAlert />
          </a>
          <a
            className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
            href="#"
            data-tooltip-id="sidebar-tooltips"
            data-tooltip-content="Настройки"
            onClick={onSettingsClick}
          >
            <Settings2 size={26} />
          </a>
          <a
            className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
            href="#"
            data-tooltip-id="sidebar-tooltips"
            data-tooltip-content="Очистить блокировки"
            onClick={onClearClick}
          >
            <Ban />
          </a>
          <a
            className="flex items-center justify-center w-10 h-10 mt-2 rounded-full hover:bg-gray-700 hover:text-gray-300"
            href="#"
            data-tooltip-id="sidebar-tooltips"
            data-tooltip-content="Обновить"
            onClick={onRefreshClick}
          >
            <RefreshCcw />
          </a>
        </div>
      </div>

      <Tooltip
        id="sidebar-tooltips"
        style={{ backgroundColor: "rgb(22 26 30 / 53%)", color: "#fff" }}
        noArrow={true}
      />
    </div>
  );
}
