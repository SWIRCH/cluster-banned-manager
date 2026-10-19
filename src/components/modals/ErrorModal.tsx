import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import Modal from "./Modal";

type ErrorModalProps = {
  open: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
};

export default function ErrorModal({
  open,
  title,
  message,
  details,
  onClose,
  onRetry,
}: ErrorModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // При следующем открытии детали снова свёрнуты.
  useEffect(() => {
    if (!open) setShowDetails(false);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      zIndex="z-[2000]"
      size="md"
      // Заголовок нужен для скринридеров, а визуально он выводится в теле ниже.
      title={title}
      visibleHeader={false}
      // Ошибка — компактное окно по центру, а не полноэкранный режим.
      fullScreenOnMobile={true}
      footer={
        <>
          <Button
            className="w-full"
            size={isMobile ? "lg" : "default"}
            variant="outline"
            onClick={onClose}
          >
            {t("buttons.close")}
          </Button>
          {onRetry && (
            <Button
              className={cn("w-full")}
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={() => {
                onClose();
                onRetry();
              }}
            >
              {t("buttons.retry")}
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-red-400">{title}</h3>
          <p className="text-sm text-white/70 mt-1 break-words select-text">
            {message}
          </p>
        </div>
      </div>

      {details && (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={showDetails}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? t("errors.hide_details") : t("errors.show_details")}
          </button>

          {showDetails && (
            <pre
              className={cn(
                "select-text mt-2 p-3 bg-black/30 rounded text-xs text-white/60 overflow-auto max-h-48 font-mono max-w-full",
                details.length < 300 && "text-wrap",
              )}
            >
              {details}
            </pre>
          )}
        </div>
      )}
    </Modal>
  );
}
