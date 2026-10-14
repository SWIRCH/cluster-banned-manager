import { useAppStore } from "@/store/useAppStore";
import type { Cluster, Region } from "@/types/cluster";
import { memo } from "react";
import { ApplyClusterAlert, SelectiveBlocking } from "./";
import { useElementHeight } from "./hooks/useElementHeight";

type ClusterBlockingPanelProps = {
  clusters: Cluster[];
  checkedMap: Record<string, boolean>;
  hostsMismatch: boolean;
  allBlockedDomains: string[];
  onToggle: (domain: string, checked: boolean) => void;
  onSelect: (domain: string) => void;
  onDisableAll: () => void;
  onEnableAll: () => void;

  selectedRegion?: Region;
  lastTauriError: string | null;
  mismatchDomains: string[];
  onUpdate: () => void;
  onCancel: () => void;
};

function ClusterBlockingPanel({
  clusters,
  checkedMap,
  hostsMismatch,
  selectedRegion,
  lastTauriError,
  mismatchDomains,
  allBlockedDomains,
  onToggle,
  onSelect,
  onDisableAll,
  onEnableAll,
  onUpdate,
  onCancel,
}: ClusterBlockingPanelProps) {
  const isMobile = useAppStore((s) => s.isMobile);

  const [alertRef, alertHeight] = useElementHeight<HTMLDivElement>();
  const showAlert = hostsMismatch && !isMobile;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {showAlert && selectedRegion && (
        <ApplyClusterAlert
          ref={alertRef}
          hostsMismatch={hostsMismatch}
          selectedRegion={selectedRegion}
          allBlockedDomains={allBlockedDomains}
          lastTauriError={lastTauriError}
          mismatchDomains={mismatchDomains}
          onUpdate={onUpdate}
          onCancel={onCancel}
        />
      )}

      <SelectiveBlocking
        clusters={clusters}
        checkedMap={checkedMap}
        hostsMismatch={hostsMismatch}
        topOffset={alertHeight}
        onToggle={onToggle}
        onSelect={onSelect}
        onDisableAll={onDisableAll}
        onEnableAll={onEnableAll}
      />
    </div>
  );
}

export default memo(ClusterBlockingPanel);
