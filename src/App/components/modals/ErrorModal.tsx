import { motion } from "framer-motion";
import { useState } from "react";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <motion.div
        className="backdrop-blur-2xl rounded-xl bg-white/5 p-6 sm:p-4 relative w-[min(500px,90%)] border border-red-500/30"
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.995 }}
        transition={{ duration: 0.18 }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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
              <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-white/60 overflow-auto max-h-48 font-mono">
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
      </motion.div>
    </div>
  );
}
