import { launchGame } from "../lib/tauri";
import type { Game } from "../types/cluster";

interface ModalState {
  setTitle: (t: string) => void;
  setMessage: (m: string) => void;
  setIsError: (e: boolean) => void;
  setOpen: (o: boolean) => void;
}

export function useGameLauncher(
  game: Game | undefined,
  gameRunning: boolean,
  killGame: () => Promise<void>,
  checkGameRunning: () => void,
  infoModal: ModalState,
) {
  const handlePlayClick = async () => {
    try {
      if (gameRunning) {
        await killGame();
        infoModal.setTitle("Закрытие игры");
        infoModal.setMessage("Попытка закрыть процесс игры...");
        infoModal.setIsError(false);
        infoModal.setOpen(true);
        return;
      }

      const appId: number = game?.appId ?? 444200;
      await launchGame(appId);

      infoModal.setTitle("Запуск...");
      infoModal.setMessage("Запрос на запуск отправлен: Steam будет открыт.");
      infoModal.setIsError(false);
      infoModal.setOpen(true);

      setTimeout(() => checkGameRunning(), 10000);
    } catch (err) {
      infoModal.setTitle("Ошибка");
      infoModal.setMessage(String(err));
      infoModal.setIsError(true);
      infoModal.setOpen(true);
    }
  };

  return { handlePlayClick };
}
