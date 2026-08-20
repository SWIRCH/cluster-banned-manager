import Modal from "./Modal";

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isError?: boolean;
};

export default function InfoModal({
  open,
  onClose,
  title,
  message,
  isError = false,
}: InfoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClass="w-[min(600px,90%)]"
      zIndex="z-60"
    >
      <h3
        className={
          "text-lg font-semibold mb-2 " +
          (isError ? "text-red-400" : "text-green-400")
        }
      >
        {title}
      </h3>
      <p className="text-sm text-white/60 mb-4 whitespace-pre-wrap">
        {message}
      </p>
      <div className="flex justify-end gap-2">
        <button
          className="steam-btn bg-yellow-400 text-black px-4 py-2 rounded"
          onClick={onClose}
        >
          ОК
        </button>
      </div>
    </Modal>
  );
}
