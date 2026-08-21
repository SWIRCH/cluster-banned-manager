import type { Game, Region } from "../../types/cluster";

type MobileBottomBarProps = {
  game: Game;
  selectedRegion: Region | null;
  onRegionChange: (regionId: string) => void;
};

export default function MobileBottomBar({
  game,
  selectedRegion,
  onRegionChange,
}: MobileBottomBarProps) {
  return (
    <div className="mobile-bottom-bar">
      <div className="mobile-bottom-bar__container">
        {game.clusters.map((region) => {
          const isActive = region.id === selectedRegion?.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onRegionChange(region.id)}
              className={`mobile-bottom-bar__item ${
                isActive ? "mobile-bottom-bar__item--active" : ""
              }`}
            >
              <img
                src={region.icon}
                alt={region.name}
                className={`mobile-bottom-bar__icon ${
                  isActive ? "mobile-bottom-bar__icon--active" : ""
                }`}
              />
              {region.alias_name !== "RU" && region.flag_icon && (
                <img
                  src={region.flag_icon}
                  alt="flag"
                  className="mobile-bottom-bar__flag"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
