import { Ban, RefreshCcw, Settings2 } from "lucide-react";

type MobileTopBarProps = {
  onRefreshClick: () => void;
  onClearClick: () => void;
  onSettingsClick: () => void;
};

export default function MobileTopBar({
  onRefreshClick,
  onClearClick,
  onSettingsClick,
}: MobileTopBarProps) {
  return (
    <div className="sticky top-0 z-40 w-full bg-[#101015]/90 backdrop-blur-md border-b border-white/10 pt-[env(safe-area-inset-top,48px)] pb-2 px-4">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
            onClick={onSettingsClick}
            title="Настройки"
          >
            <Settings2 size={20} />
          </button>

          <button
            type="button"
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
            onClick={onClearClick}
            title="Очистить блокировки"
          >
            <Ban size={20} />
          </button>

          <button
            type="button"
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
            onClick={onRefreshClick}
            title="Обновить"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
