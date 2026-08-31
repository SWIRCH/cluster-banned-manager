import Android from "@/components/Icons/Android";
import AppleIOS from "@/components/Icons/iOS";
import MacOS from "@/components/Icons/macOS";
import Windows from "@/components/Icons/Windows";
import { useTranslation } from "@/hooks/useTranslation";
import { activePlatform, type PlatformKey } from "@/stores/platform";
import type { IconProps } from "@/types/Icon.type";
import { useStore } from "@nanostores/react";
import { motion } from "framer-motion";

export const PLATFORM_CONFIG: Record<PlatformKey, { label: string; Icon: React.ComponentType<IconProps> }> = {
  windows: { label: "Windows", Icon: Windows },
  android: { label: "Android", Icon: Android },
  ios: { label: "iOS", Icon: AppleIOS },
  macos: { label: "macOS", Icon: MacOS },
};

export default function WrapperFooterTabs() {
  const active = useStore(activePlatform);
  const { t } = useTranslation();

  return (
    <div className="releases sticky bottom-0">
      <div className="container">
        <div className="text-content flex flex-col">
          <h3>{t("wrapper.footer.title")}</h3>
          <span>{t("wrapper.footer.subtitle")}</span>
        </div>

        <div className="platform">
          {(Object.keys(PLATFORM_CONFIG) as PlatformKey[]).map((key) => {
            const { label, Icon } = PLATFORM_CONFIG[key];
            const isActive = active === key;

            return (
              <button
                key={key}
                className="platform-tab flex flex-col items-center gap-1.5 relative"
                onClick={() => activePlatform.set(key)}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-platform-pill"
                    className="platform-tab__pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className={`size-8 relative z-10 `} />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
