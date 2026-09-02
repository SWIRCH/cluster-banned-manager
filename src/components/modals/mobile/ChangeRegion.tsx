import { useClustersLoader } from "@/hooks"
import { useAppStore } from "@/store/useAppStore"
import type { Game, Region } from "@/types"
import { saveRegionId } from "@/utils/regionStorage"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Modal from "../Modal"

type ChangeRegionProps = {
  regions?: Region[];
  selectedRegionId?: string;
  onRegionChange?: (regionId: string) => void;
};

export default function ChangeRegionModal({
  regions: propRegions,
  selectedRegionId: propSelectedRegionId,
  onRegionChange: propOnRegionChange,
}: ChangeRegionProps) {
  const isOpen = useAppStore((state) => state.regionModalOpen);
  const setIsOpen = useAppStore((state) => state.setRegionModalOpen);
  const onClose = () => setIsOpen(false);

  const { selectedRegionId: storeRegionId, setSelectedRegionId } =
    useAppStore();

  const { clustersData } = useClustersLoader();
  const game = clustersData as Game;

  const activeSelectedRegionId = propSelectedRegionId ?? storeRegionId;
  const regionList = propRegions ?? game?.regions ?? [];

  const handleSelect = (regionId: string) => {
    if (propOnRegionChange) {
      propOnRegionChange(regionId);
    } else {
      setSelectedRegionId(regionId);
      saveRegionId(regionId);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      zIndex="z-[1000]"
      classNames={{
        body: "w-full h-full p-6 sm:p-4 !rounded-none !pt-4 !px-4",
      }}
    >
      <button type="button" className="btn back" onClick={onClose}>
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
