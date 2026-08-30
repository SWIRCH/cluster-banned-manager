import { useTranslation } from "@/hooks/useTranslation";
import { activePlatform } from "@/stores/platform";
import { useStore } from "@nanostores/react";
import { Button } from "../button";
import { PLATFORM_CONFIG } from "./Footer";

export default function PlatformDownloadButton() {
  const platform = useStore(activePlatform);
  const { label, Icon } = PLATFORM_CONFIG[platform];
  const { t } = useTranslation();

  return (
    <Button className="btn rounded-full " size={"xl"}>
      <Icon
        className="size-6 mr-2"
        fill="#000000"
        fills={platform === "android" ? { main: "#000000", second: "#ffffff" } : undefined}
      />
      {t("common.downloadFor")} {label}
    </Button>
  );
}
