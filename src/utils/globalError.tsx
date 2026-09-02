// src/utils/globalError.ts
import { createRoot } from "react-dom/client"
import { ErrorModal } from "../components/modals"
import { logger } from './logger'

let errorModalRoot: any = null;
let errorModalContainer: HTMLDivElement | null = null;

function createErrorModalContainer() {
  if (errorModalContainer) return errorModalContainer;

  const container = document.createElement("div");
  container.id = "global-error-modal";
  document.body.appendChild(container);
  errorModalContainer = container;
  return container;
}

export function showGlobalError(
  title: string,
  message: string,
  details?: string,
  onRetry?: () => void,
) {
  logger.log("🔴🔴🔴 showGlobalError ВЫЗВАН!", { title, message });

  const container = createErrorModalContainer();

  if (!errorModalRoot) {
    errorModalRoot = createRoot(container);
  }

  const closeModal = () => {
    errorModalRoot.render(null);
  };

  errorModalRoot.render(
    <ErrorModal
      open={true}
      title={title}
      message={message}
      details={details}
      onClose={closeModal}
      onRetry={onRetry}
    />,
  );
}

export function hideGlobalError() {
  if (errorModalRoot) {
    errorModalRoot.render(null);
  }
}
