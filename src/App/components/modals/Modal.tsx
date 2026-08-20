import { motion, AnimatePresence } from "framer-motion";
import React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string; // Например: "w-[min(600px,90%)]"
  zIndex?: string; // Например: "z-50" или "z-[9999]"
};

export default function Modal({
  open,
  onClose,
  children,
  maxWidthClass = "w-[min(600px,90%)]",
  zIndex = "z-50",
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 ${zIndex} flex items-center justify-center`}
        >
          {/* Бэкдроп */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Тело модалки с общей анимацией */}
          <motion.div
            className={`backdrop-blur-2xl rounded-xl bg-white/5 p-6 sm:p-4 relative ${maxWidthClass}`}
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.995 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
