import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { motion } from "framer-motion";
import { Loader2, Download, AlertCircle, CheckCircle, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import {
  checkAndroidUpdate,
  downloadAndroidUpdate,
  type AndroidUpdateInfo,
} from "../../utils/updater";

type LoadingScreenProps = {
  visible: boolean;
  onLoadingComplete?: () => void;
  isMobile: boolean;
};

type AppStatus =
  | "initializing"
  | "checking_updates"
  | "update_available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "completed"
  | "error"
  | "ready";

export default function LoadingScreen({
  visible,
  onLoadingComplete,
  isMobile,
}: LoadingScreenProps) {
  if (!visible) return null;

  const [appStatus, setAppStatus] = useState<AppStatus>("initializing");
  const [androidUpdateInfo, setAndroidUpdateInfo] =
    useState<AndroidUpdateInfo | null>(null);
  const [desktopUpdateInfo, setDesktopUpdateInfo] = useState<Update | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setAppStatus("checking_updates");
      checkForUpdates();
    }, 2500);

    return () => clearTimeout(initTimer);
  }, []);

  async function checkForUpdates() {
    try {
      if (isMobile) {
        // Логика для Android
        const update = await checkAndroidUpdate();

        if (update) {
          setAndroidUpdateInfo(update);
          setAppStatus("update_available");
          return;
        }
      } else {
        // Логика для ПК (Tauri Updater Plugin)
        const update = await check();

        if (update?.available) {
          setDesktopUpdateInfo(update);
          setAppStatus("update_available");
          return;
        }
      }

      setAppStatus("ready");
      setTimeout(() => {
        onLoadingComplete?.();
      }, 1200);
    } catch (error) {
      console.error("Ошибка проверки обновлений:", error);
      setAppStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ошибка при проверке обновлений",
      );
    }
  }

  async function handleInstallUpdate() {
    if (isMobile) {
      // Android: открываем ссылку на APK
      if (!androidUpdateInfo?.url) return;

      try {
        await downloadAndroidUpdate(androidUpdateInfo.url);
        skipUpdate();
      } catch (error) {
        console.error("Ошибка открытия ссылки:", error);
        setAppStatus("error");
        setErrorMessage("Не удалось открыть ссылку на скачивание");
      }
    } else {
      // Desktop: автоматическое скачивание, установка и перезапуск
      if (!desktopUpdateInfo) return;

      try {
        setAppStatus("downloading");
        await desktopUpdateInfo.download();

        setAppStatus("downloaded");

        setTimeout(async () => {
          try {
            setAppStatus("installing");
            await desktopUpdateInfo.install();

            setAppStatus("completed");

            setTimeout(async () => {
              await relaunch();
            }, 1500);
          } catch (installError) {
            console.error("Ошибка установки:", installError);
            setAppStatus("error");
            setErrorMessage("Ошибка при установке обновления");
          }
        }, 500);
      } catch (downloadError) {
        console.error("Ошибка скачивания:", downloadError);
        setAppStatus("error");
        setErrorMessage("Ошибка при скачивании обновления");
      }
    }
  }

  function skipUpdate() {
    setAppStatus("ready");
    setTimeout(() => {
      onLoadingComplete?.();
    }, 300);
  }

  const version = isMobile
    ? androidUpdateInfo?.version
    : desktopUpdateInfo?.version;
  const releaseNotes = isMobile
    ? androidUpdateInfo?.notes
    : desktopUpdateInfo?.body;

  const getStatusContent = () => {
    switch (appStatus) {
      case "initializing":
        return {
          icon: <Cpu size={48} className="text-blue-400" strokeWidth={2} />,
          title: "Инициализация...",
          description: "Загрузка компонентов приложения",
          showSpinner: true,
          showButtons: false,
          progress: 30,
        };
      case "checking_updates":
        return {
          icon: <Loader2 size={48} className="text-blue-400" strokeWidth={2} />,
          title: "Проверка обновлений...",
          description: "Ищем доступные обновления",
          showSpinner: true,
          showButtons: false,
          progress: 60,
        };
      case "update_available":
        return {
          icon: (
            <Download size={48} className="text-yellow-400" strokeWidth={2} />
          ),
          title: `Доступно обновление v${version || ""}`,
          description: isMobile
            ? "Новая версия приложения готова к скачиванию"
            : "Новая версия готова к установке",
          showSpinner: false,
          showButtons: true,
          progress: 80,
        };
      case "downloading":
        return {
          icon: <Loader2 size={48} className="text-blue-400" strokeWidth={2} />,
          title: "Скачивание обновления...",
          description: "Пожалуйста, подождите",
          showSpinner: true,
          showButtons: false,
          progress: 70,
        };
      case "downloaded":
        return {
          icon: (
            <CheckCircle size={48} className="text-green-400" strokeWidth={2} />
          ),
          title: "Обновление скачано!",
          description: "Подготовка к установке...",
          showSpinner: false,
          showButtons: false,
          progress: 85,
        };
      case "installing":
        return {
          icon: (
            <Loader2 size={48} className="text-green-400" strokeWidth={2} />
          ),
          title: "Установка обновления...",
          description: "Пожалуйста, подождите",
          showSpinner: true,
          showButtons: false,
          progress: 90,
        };
      case "completed":
        return {
          icon: (
            <CheckCircle size={48} className="text-green-400" strokeWidth={2} />
          ),
          title: "Обновление установлено!",
          description: "Приложение перезапустится через несколько секунд",
          showSpinner: false,
          showButtons: false,
          progress: 100,
        };
      case "error":
        return {
          icon: (
            <AlertCircle size={48} className="text-red-400" strokeWidth={2} />
          ),
          title: "Ошибка",
          description: errorMessage || "Произошла ошибка",
          showSpinner: false,
          showButtons: true,
          progress: 100,
        };
      case "ready":
        return {
          icon: (
            <CheckCircle size={48} className="text-green-400" strokeWidth={2} />
          ),
          title: "Готово!",
          description: "Приложение загружено",
          showSpinner: false,
          showButtons: false,
          progress: 100,
        };
      default:
        return {
          icon: (
            <Loader2 size={48} className="text-yellow-400" strokeWidth={2} />
          ),
          title: "Загрузка...",
          description: "Инициализация приложения",
          showSpinner: true,
          showButtons: false,
          progress: 0,
        };
    }
  };

  const status = getStatusContent();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900"
    >
      <div className="flex flex-col items-center gap-6 max-w-md p-8">
        <motion.div
          animate={status.showSpinner ? { rotate: 360 } : {}}
          transition={{
            duration: 1,
            repeat: status.showSpinner ? Infinity : 0,
            ease: "linear",
          }}
        >
          {status.icon}
        </motion.div>

        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white text-xl font-medium"
          >
            {status.title}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-sm"
          >
            {status.description}
          </motion.div>
        </div>

        {/* Прогресс-бар */}
        <div className="w-64 h-1 bg-gray-700 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-linear-to-r from-blue-400 to-blue-500"
          />
        </div>

        {/* Кнопка Пропустить при поиске */}
        {appStatus === "checking_updates" && (
          <motion.div>
            <button
              onClick={skipUpdate}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Пропустить
            </button>
          </motion.div>
        )}

        {/* Кнопки действий */}
        {status.showButtons && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 mt-2"
          >
            {appStatus === "update_available" && (
              <>
                <button
                  onClick={handleInstallUpdate}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  {isMobile ? "Скачать APK" : "Установить"}
                </button>
                <button
                  onClick={skipUpdate}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Позже
                </button>
              </>
            )}
            {appStatus === "error" && (
              <button
                onClick={skipUpdate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Продолжить
              </button>
            )}
          </motion.div>
        )}

        {/* Список изменений (notes) */}
        {appStatus === "update_available" && releaseNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 bg-white/10 rounded-lg max-h-40 overflow-y-auto w-full text-left"
          >
            <div className="text-white/80 text-sm whitespace-pre-line">
              {releaseNotes}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
