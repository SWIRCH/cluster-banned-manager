import Modal from "./Modal";

type AdminModalProps = {
  open: boolean;
  onShowInstructions: () => void;
};

export default function AdminModal({
  open,
  onShowInstructions,
}: AdminModalProps) {
  return (
    <Modal open={open} onClose={onShowInstructions} zIndex="z-[1000]">
      <h3 className="text-lg font-semibold mb-2">
        Требуются права администратора
      </h3>
      <p className="text-sm text-white/60 mb-4">
        Приложение не обладает правами для изменения системного файла hosts.
        Чтобы использовать функциональность блокировки/разблокировки серверов,
        запустите приложение с правами администратора.
      </p>

      <div className="flex justify-end gap-2">
        <button
          className="steam-btn bg-yellow-400 text-black px-4 py-2 rounded"
          onClick={onShowInstructions}
        >
          Инструкция
        </button>
      </div>
    </Modal>
  );
}
