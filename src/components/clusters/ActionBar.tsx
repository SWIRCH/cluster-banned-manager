import { Button } from "@/components/ui/button";
import { t } from "i18next";
import { Check } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { BestPingObject } from "./type/ping.type";

type ActionBarProps = {
  bestPing: BestPingObject | null;
  // onToggle: (domain: string, checked: boolean) => void;
  onSelect: (domain: string) => void;
  onDisableAll: () => void;
  onEnableAll: () => void;
};

export default function ActionBar({
  bestPing,
  onSelect,
  onDisableAll,
  onEnableAll,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      <Button
        variant={"outline"}
        className={"rounded-full px-3"}
        onClick={() => onEnableAll()}
      >
        {t("buttons.allow_all")}
      </Button>
      <Button
        variant={"outline"}
        className={"rounded-full px-3"}
        onClick={() => onDisableAll()}
      >
        {t("buttons.disallow_all")}
      </Button>

      {bestPing?.bestDomain ? (
        <Button
          variant={"outline"}
          className={
            "group rounded-full border-blue-400! text-blue-400 hover:border-blue-300! hover:text-blue-300"
          }
          onClick={() => onSelect(bestPing.bestDomain.domain)}
        >
          <Check className="text-blue-400 group-hover:text-blue-300" />
          {t("buttons.best_ping")}: {bestPing.bestDomain.id}
        </Button>
      ) : (
        <Button variant={"outline"} className={"rounded-full "} disabled={true}>
          <Spinner />
          {t("loading.search_best_ping")}
        </Button>
      )}
    </div>
  );
}
