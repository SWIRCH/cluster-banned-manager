import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../Modal";
import { useAppStore } from "../../../../store/useAppStore";
import { useClustersLoader } from "../../../../hooks";
import { saveRegionId } from "../../../../utils/regionStorage";
import type { Region, Game } from "../../../../types";

type ChangeRegionProps = {
  open?: boolean;
  onClose?: () => void;
  regions?: Region[];
  selectedRegionId?: string;
  onRegionChange?: (regionId: string) => void;
};

export default function ChangeRegionModal({
  open: propOpen,
  onClose: propOnClose,
  regions: propRegions,
  selectedRegionId: propSelectedRegionId,
  onRegionChange: propOnRegionChange,
}: ChangeRegionProps) {
  const {
    regionModalOpen,
    setRegionModalOpen,
    selectedRegionId: storeRegionId,
    setSelectedRegionId,
  } = useAppStore();

  const { clustersData } = useClustersLoader();
  const game = clustersData as Game;

  // Используем пропсы, если они переданы, иначе берём из Zustand / Loader
  const isOpen = propOpen ?? regionModalOpen;
  const activeSelectedRegionId = propSelectedRegionId ?? storeRegionId;
  const regionList = propRegions ?? game?.regions ?? [];

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setRegionModalOpen(false);
    }
  };

  const handleSelect = (regionId: string) => {
    if (propOnRegionChange) {
      propOnRegionChange(regionId);
    } else {
      setSelectedRegionId(regionId);
      saveRegionId(regionId);
    }
    handleClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      zIndex="z-[1000]"
      classNames={{
        body: "w-full h-full p-6 sm:p-4 !rounded-none !pt-4 !px-4",
      }}
    >
      <button type="button" className="btn back" onClick={handleClose}>
        <ChevronLeft />
        <span>Назад</span>
      </button>

      <div className="mt-5 px-3">
        <h2 className="text-lg font-semibold mb-4">Регионы</h2>

        <div className="flex flex-col gap-2 mb-6 mt-2">
          {regionList.map((region) => {
            const isSelected = region.id === activeSelectedRegionId;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => handleSelect(region.id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                  isSelected
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={region.flag_icon}
                      alt={region.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="font-medium text-white">
                      {region.name}
                    </span>
                  </div>

                  <ChevronRight />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
