import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React from "react";

export type ModalSizeType =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

/**
 * Важно: в shadcn DialogContent по умолчанию стоит `sm:max-w-lg`.
 * Если задать просто `max-w-2xl`, на десктопе всё равно победит `sm:max-w-lg`
 * (разные варианты tailwind-merge не склеивает). Поэтому здесь везде `sm:`.
 * Классы записаны целиком, чтобы Tailwind их видел при сборке.
 */
const sizeClasses: Record<ModalSizeType, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
  "7xl": "sm:max-w-7xl",
};

/**
 * Полноэкранный режим на телефонах (< 640px).
 * - dvh вместо vh: не прыгает от адресной строки и экранной клавиатуры
 * - env(safe-area-inset-*): вырез/статус-бар/жестовая панель (Android/iOS)
 * - крестик закрытия смещается вниз на величину верхнего inset
 */
const mobileFullScreen = [
  "max-sm:top-0 max-sm:left-0",
  "max-sm:translate-x-0 max-sm:translate-y-0",
  "max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full",
  "max-sm:rounded-none max-sm:border-0",
  "max-sm:pt-[calc(env(safe-area-inset-top)+1rem)]",
  "max-sm:pb-[calc(env(safe-area-inset-bottom)+1rem)]",
  "max-sm:[&>button]:top-[calc(env(safe-area-inset-top)+0.75rem)]",
].join(" ");

export type ModalProps = {
  open: boolean;
  onClose: () => void | Promise<void>;
  title?: string;
  description?: string | React.ReactNode;
  /** false — заголовок остаётся для скринридеров (sr-only), но не виден. */
  visibleHeader?: boolean;
  children: React.ReactNode;
  size?: ModalSizeType;
  /**
   * Заменяет `size`. Указывай с префиксом `sm:`, например `sm:max-w-[900px]`,
   * иначе дефолт shadcn (`sm:max-w-lg`) перебьёт класс на десктопе.
   */
  maxWidthClass?: string;
  zIndex?: string;
  footer?: React.ReactNode;
  /** На телефонах открывать на весь экран. По умолчанию true. */
  fullScreenOnMobile?: boolean;
  /** Фокус на первый элемент при открытии. По умолчанию false (не вызывать клавиатуру). */
  autoFocus?: boolean;
  classNames?: {
    header?: {
      main?: string;
      title?: string;
      description?: string;
    };
    main?: string;
    body?: string;
    footer?: string;
    overlay?: string;
    /** @deprecated Раньше нигде не применялось. Оставлено для совместимости типов. */
    backdrop?: string;
  };
};

export default function Modal({
  open,
  onClose,
  children,
  title,
  description,
  visibleHeader = true,
  footer,
  maxWidthClass,
  size = "2xl",
  zIndex = "z-(--z-modal)",
  fullScreenOnMobile = true,
  autoFocus = false,
  classNames,
}: ModalProps) {
  const isHeaderHidden = !visibleHeader || (!title && !description);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) void onClose();
      }}
    >
      <DialogOverlay className={cn(classNames?.overlay, "z-(--z-overlay)")} />

      <DialogContent
        initialFocus={autoFocus ? undefined : false}
        className={cn(
          "flex flex-col gap-4 overflow-hidden max-h-[85dvh]",
          maxWidthClass ?? sizeClasses[size],
          fullScreenOnMobile && mobileFullScreen,
          classNames?.main,
          zIndex,
        )}
      >
        <DialogHeader
          className={cn(
            "shrink-0",
            isHeaderHidden && "sr-only",
            classNames?.header?.main,
          )}
        >
          <DialogTitle className={classNames?.header?.title}>
            {title || "Dialog"}
          </DialogTitle>

          {description && (
            <DialogDescription className={classNames?.header?.description}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain",
            classNames?.body,
          )}
        >
          {children}
        </div>

        {footer && (
          <DialogFooter className={cn("shrink-0", classNames?.footer)}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
