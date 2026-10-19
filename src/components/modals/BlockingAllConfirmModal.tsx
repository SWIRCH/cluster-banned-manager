import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Field, FieldLabel } from "../ui/field";
import Modal from "./Modal";

type BlockingAllConfirmModalProps = {
  onConfirm: () => void;
  regionName: string;
};

export default function BlockingAllConfirmModal({
  onConfirm,
  regionName,
}: BlockingAllConfirmModalProps) {
  const [ack, setAck] = useState(false);

  const isOpen = useAppStore((state) => state.blockingAllConfirmOpen);
  const setIsOpen = useAppStore((state) => state.setBlockingAllConfirmOpen);
  const onClose = () => setIsOpen(false);

  const { t } = useTranslation();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("modals.blocking_all_confirm.title")}
      description={
        <Trans
          i18nKey={"modals.blocking_all_confirm.description"}
          values={{ region: regionName }}
        />
      }
    >
      <Field orientation="horizontal" className="py-2">
        <Checkbox
          id="terms-checkbox-invalid"
          name="terms-checkbox-invalid"
          checked={ack}
          onCheckedChange={(e) => setAck(e)}
        />
        <FieldLabel htmlFor="terms-checkbox-invalid" className="bg-transparent">
          Я понимаю, что это отключит доступ к игре в этом регионе
        </FieldLabel>
      </Field>

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
