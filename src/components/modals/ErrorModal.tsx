import { useState } from "react";
import Modal from "./Modal";
import { X } from "lucide-react";

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClass="w-[min(500px,90%)]"
      zIndex="z-[9999]"
    >
      <div className="border border-red-500/30 -m-6 p-6 sm:-m-4 sm:p-4 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400">{title}</h3>
            <p className="text-sm text-white/70 mt-1">{message}</p>
          </div>
        </div>

        {details && (
          <div className="mb-4">
            <button
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Скрыть детали" : "Показать детали"}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-white/60 overflow-auto max-h-48 font-mono max-w-full">
                {details}
              </pre>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="btn bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition-colors"
            onClick={onClose}
          >
            Закрыть
          </button>
          {onRetry && (
            <button
              className="btn bg-blue-500/20 text-blue-400 px-4 py-2 rounded hover:bg-blue-500/30 transition-colors"
              onClick={() => {
                onClose();
                onRetry();
              }}
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
