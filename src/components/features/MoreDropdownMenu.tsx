import { useIsMobile } from "@/hooks";
import { openGithub as onOpenGithub } from "@/utils/opener";
import { MenuItem, MenuItems } from "@headlessui/react";
import { t } from "i18next";
import { Code, Github } from "lucide-react";

type MoreDropdownMenuProps = {
  onAboutModal: (state: boolean) => void;
};

export default function MoreDropdownMenu({
  onAboutModal,
}: MoreDropdownMenuProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <MenuItems
        transition
        anchor={isMobile ? "top end" : "right"}
        className="w-52 origin-bottom-right rounded-xl border border-white/10 bg-bg-sidebar p-1 text-sm/6 text-white backdrop-blur-md shadow-2xl transition duration-100 ease-out [--anchor-gap:12px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
      >
        <MenuItem>
          <button
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
            onClick={() => onOpenGithub?.()}
          >
            <Github className="size-4 text-white/30" />
            GitHub
          </button>
        </MenuItem>

        <div className="my-1 h-px bg-white/10" />

        <MenuItem>
          <button
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
            onClick={() => onAboutModal(true)}
          >
            <Code className="size-4 text-white/30" />
            {t("sidebar.about_app")}
          </button>
        </MenuItem>
      </MenuItems>
    </>
  );
}
