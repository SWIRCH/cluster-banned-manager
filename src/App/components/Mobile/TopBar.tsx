import { ChevronRight } from "lucide-react";
import { useAppStore } from "../../../store/useAppStore";
import ChangeRegionModal from "../Modals/mobile/ChangeRegion";

export default function MobileTopBar() {
  const game = useAppStore((state) => state.game);
  const selectedRegionId = useAppStore((state) => state.selectedRegionId);
  const setChangeRegionOpen = useAppStore((state) => state.setRegionModalOpen);

  const selectedRegion = game?.regions.find((r) => r.id === selectedRegionId);

  return (
    <>
      <div
        className="mobile-top-bar-container sticky top-0 z-40 w-full pb-2 px-4"
        onClick={() => setChangeRegionOpen(true)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img
              className="rounded-full"
              src={selectedRegion?.flag_icon}
              width={42}
              height={42}
            />

            <div className="region-named flex flex-col">
              <span>{selectedRegion?.name}</span>
              <span className="text-muted">
                {selectedRegion?.clusters[0].domain}
              </span>
            </div>
          </div>

          <ChevronRight size={26} />
        </div>
      </div>

      <ChangeRegionModal />
    </>
  );
}
