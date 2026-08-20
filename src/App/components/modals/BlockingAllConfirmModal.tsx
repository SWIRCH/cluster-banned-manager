import { useState } from "react";
import Modal from "./Modal";

type BlockingAllConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  regionName: string;
};

export default function BlockingAllConfirmModal({
  open,
  onClose,
  onConfirm,
  regionName,
}: BlockingAllConfirmModalProps) {
  const [ack, setAck] = useState(false);

  return (
    <Modal open={open} onClose={onClose} zIndex="z-[50]">
      <h3 className="text-lg font-semibold mb-2">
        Подтвердите блокировку всех серверов
      </h3>
      <p className="text-sm text-white/60 mb-4">
        Вы собираетесь заблокировать <strong>все</strong> серверы региона{" "}
        <strong>{regionName}</strong>. Это приведёт к тому, что игра не сможет
        подключаться к серверам этого региона — вы фактически отключите доступ к
        игре в этом регионе.
      </p>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className="text-sm text-white/60">
          Я понимаю, что это отключит доступ к игре в этом регионе
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <button className="btn bg-white/10 px-4 py-2 rounded" onClick={onClose}>
          Отмена
        </button>
        <button
          className="steam-btn bg-red-600 text-white px-4 py-2 rounded"
          disabled={!ack}
          onClick={() => {
            onConfirm();
            setAck(false);
          }}
        >
          Подтвердить блокировку
        </button>
      </div>
    </Modal>
  );
}
