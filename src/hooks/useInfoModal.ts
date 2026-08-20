import { useState } from "react";

export function useInfoModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const showInfo = (newTitle: string, newMessage: string, error = false) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setIsError(error);
    setOpen(true);
  };

  const closeInfo = () => setOpen(false);

  return {
    open,
    title,
    message,
    isError,
    showInfo,
    closeInfo,
    setTitle,
    setMessage,
    setIsError,
    setOpen,
  };
}
