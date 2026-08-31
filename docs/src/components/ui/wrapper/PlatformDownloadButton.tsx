import { useTranslation } from "@/hooks/useTranslation";
import { activePlatform } from "@/stores/platform";
import { config } from "@/utils/config";
import { openUrl } from "@/utils/openUrl";
import { useStore } from "@nanostores/react";
import { CircleX } from "lucide-react";
import { Button } from "../button";
import { PLATFORM_CONFIG } from "./Footer";

const SUPPORTED_PLATFORMS = ["android", "windows"] as const;

export default function PlatformDownloadButton() {
  const platform = useStore(activePlatform);
  const { t } = useTranslation();

  const isSupported = SUPPORTED_PLATFORMS.includes(platform as any);
  const currentConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  const { label, Icon } = currentConfig || {};

  return (
    <>
      <Button
        className="btn rounded-full"
        size={"xl"}
        onClick={() => openUrl(config.RELEASE_URL)}
        disabled={isSupported && currentConfig ? false : true}
      >
        {isSupported && currentConfig ? (
          <>
            <Icon
              className="size-6 mr-2"
              fill="#000000"
              fills={platform === "android" ? { main: "#000000", second: "#ffffff" } : undefined}
            />
            {t("common.downloadFor")} {label}
          </>
        ) : (
          <>
            <CircleX className="size-6 mr-1" />
            <span>{t("platform.not_available")}</span>
          </>
        )}
      </Button>

      {!isSupported ? <p>{t("platform.dev_work")}</p> : undefined}
    </>
  );
}
