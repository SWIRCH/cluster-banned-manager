import {
  ChevronLeft,
  Github,
  User,
  Info,
  ExternalLink,
  Code2,
  GitBranch,
} from "lucide-react";
import Modal from "../Modal";
import { config } from "../../../../utils/config";
import { openAuthorLink, openGithub } from "../../../../utils/opener";

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      zIndex="z-[1000]"
      classNames={{
        body: "w-full h-full p-6 sm:p-4 !rounded-none !pt-4 !px-4 bg-[#101015]",
      }}
    >
      <button type="button" className="btn back" onClick={onClose}>
        <ChevronLeft />
        <span>Назад</span>
      </button>

      <div className="mt-5 px-3">
        <h2 className="text-lg font-semibold mb-4">О приложении</h2>

        <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl mb-6 mt-3">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
            <img src="/clusterbanned.png" width={45} />
          </div>
          <h3 className="text-xl font-bold text-white text-center">
            {config.NAME}
          </h3>
          <span className="text-xs text-zinc-400 mt-1">
            Версия {config.VERSION} (Tauri v{config.TAURI_VERSION})
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-transparent">
            <div className="flex items-center gap-3">
              <User className="size-5 text-zinc-400" />
              <span className="font-medium text-zinc-300">Автор</span>
            </div>
            <span className="text-white font-medium">{config.AUTHOR}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-transparent">
            <div className="flex items-center gap-3">
              <Code2 className="size-5 text-zinc-400" />
              <span className="font-medium text-zinc-300">Сборка</span>
            </div>
            <span className="text-zinc-400 text-sm capitalize">
              {config.BUILD} ({config.BUNDLE_TYPE})
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-transparent">
            <div className="flex items-center gap-3">
              <GitBranch className="size-5 text-zinc-400" />
              <span className="font-medium text-zinc-300">Ветка</span>
            </div>
            <span className="text-zinc-400 text-sm capitalize">
              {config.BREACH}
            </span>
          </div>
        </div>

        {/* Внешние ссылки / Кнопки действий */}
        <div className="flex flex-col gap-2">
          {/* GitHub */}
          <button
            type="button"
            onClick={openGithub}
            className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20 group"
          >
            <div className="flex items-center gap-3">
              <Github className="size-5 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-white">GitHub репозиторий</span>
            </div>
            <ExternalLink className="size-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </button>

          {/* Сайт автора */}
          <button
            type="button"
            onClick={openAuthorLink}
            className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20 group"
          >
            <div className="flex items-center gap-3">
              <User className="size-5 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-white">Страница проекта</span>
            </div>
            <ExternalLink className="size-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
