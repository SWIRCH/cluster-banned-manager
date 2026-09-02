import { useAppStore } from "@/store/useAppStore"
import Modal from "./Modal"

type ClearConfirmModalProps = {
  onConfirm: () => void;
  useFirewall: boolean;
  useBackup: boolean;
  loading: boolean;
};

export default function ClearConfirmModal({
  onConfirm,
  useFirewall,
  useBackup,
  loading,
}: ClearConfirmModalProps) {
  const isOpen = useAppStore((state) => state.clearConfirmOpen);
  const setIsOpen = useAppStore((state) => state.setClearConfirmOpen);
  const onClose = () => setIsOpen(false);

  return (
    <Modal open={isOpen} onClose={onClose} zIndex="z-[50]">
      <h3 className="text-lg font-semibold mb-2">
        Очистить Hosts {useFirewall ? "& Firewall" : undefined}
      </h3>
      <p className="text-sm text-white/60 mb-4">
        Это удалит все секции и правила, добавленные приложением в файл hosts и
        в брандмауэр.{" "}
        {useBackup && "Резервная копия будет создана автоматически."} Вы
        уверены?
      </p>
      <div className="flex justify-end gap-2">
        <button className="btn bg-white/10 px-4 py-2 rounded" onClick={onClose}>
          Отмена
        </button>
        <button
          className="steam-btn bg-red-600 text-white px-4 py-2 rounded flex items-center w-full"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Обновление данных..." : "Подтвердить"}
        </button>
      </div>
    </Modal>
  );
}
