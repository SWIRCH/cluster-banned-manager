import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useSettings } from "@/hooks/useSettings";
import { getInitialLanguage } from "@/lib/i18n";
import { langFormat } from "@/utils/langForamter";
import { defaultSettings } from "@/utils/settingsStorage";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Copy,
  HeartHandshake,
  Locate,
  RefreshCcw,
  ServerCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogClose } from "../ui/dialog";
import { ToggleGroupItem } from "../ui/toggle-group";
import Modal from "./Modal";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onDiagnose: () => void;
  diagnosticInfo: string | null;
  isMobile?: boolean;
};

export default function SettingsModal({
  open,
  onClose,
  onDiagnose,
  diagnosticInfo,
  isMobile,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const { settings, updateSettings, loading } = useSettings();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [formData, setFormData] = useState(defaultSettings);

  // Test
  type syncModeValues = "local" | "hybrid" | "server";
  const [syncMode, setSyncMode] = useState<syncModeValues>("hybrid");

  useEffect(() => {
    if (!loading && settings.isSetup) {
      setFormData({
        useFirewall: settings.useFirewall ?? true,
        useBackup: settings.useBackup ?? false,
        backupCount: settings.backupCount ?? 5,
        lang: settings.lang ?? getInitialLanguage(),
      });
    }
  }, [onClose, loading, settings]);

  const onSave = async () => {
    await updateSettings(formData);
    onClose();
  };

  const handleCopy = async () => {
    if (!diagnosticInfo) return;

    await writeText(
      typeof diagnosticInfo === "string"
        ? diagnosticInfo
        : JSON.stringify(diagnosticInfo, null, 2),
    );

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedInfo = (() => {
    if (!diagnosticInfo) return null;
    if (typeof diagnosticInfo === "object") return diagnosticInfo;
    try {
      return JSON.parse(diagnosticInfo);
    } catch {
      return null;
    }
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      description={t("settings.description")}
      classNames={{
        body: `${isMobile ? "w-full h-full p-6 sm:p-4 !rounded-none !pt-4 !px-4" : ""}`,
      }}
      footer={
        // <button
        //   className="option-btn bg-yellow-400 text-black px-4 py-2 rounded font-medium font-second! text-shadow-sm"
        //   onClick={onSave}
        // >
        //   {t("buttons.save_and_close")}
        // </button>
        <div className="grid grid-cols-2 w-full gap-2">
          <DialogClose
            className={"w-full"}
            render={<Button variant="outline">{t("buttons.cancel")}</Button>}
          />
          <Button type="submit" className={"w-full"}>
            {t("buttons.save")}
          </Button>
        </div>
      }
    >
      {!isMobile ? (
        <div className="flex flex-col gap-3">
          <motion.div
            layout
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              orientation="vertical"
            >
              <TabsList className={"w-full"}>
                <TabsTrigger value="settings">
                  {t("settings.buttons.settings")}
                </TabsTrigger>
                <TabsTrigger value="debug" onClick={onDiagnose}>
                  {t("settings.buttons.debug")}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "settings" && (
                      <div className="grid gap-4 py-2">
                        <Field>
                          <FieldLabel
                            htmlFor="language"
                            className="bg-transparent"
                          >
                            {t("settings.language_interface")}
                          </FieldLabel>

                          <Select
                            value={formData.lang}
                            onValueChange={(val) => {
                              if (!val) return;

                              setFormData((prev) => ({
                                ...prev,
                                lang: val,
                              }));
                            }}
                          >
                            <SelectTrigger id="language" className={"w-full"}>
                              <SelectValue>
                                {langFormat(formData.lang)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ru" title="russian">
                                Русский (Russian)
                              </SelectItem>
                              <SelectItem value="en">
                                English (Английский)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <FieldGroup className="w-full">
                          <FieldLabel htmlFor="switch-use-firewall">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>
                                  {t("settings.use_firewall")}
                                </FieldTitle>
                                <FieldDescription>
                                  {t("settings.firewall_about")}
                                </FieldDescription>
                              </FieldContent>
                              <Switch
                                id="switch-use-firewall"
                                checked={formData.useFirewall}
                                onCheckedChange={(checked) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    useFirewall: checked,
                                  }))
                                }
                              />
                            </Field>
                          </FieldLabel>

                          <FieldLabel htmlFor="switch-use-backups">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>
                                  {t("settings.use_backups")}
                                </FieldTitle>
                                <FieldDescription>
                                  {t("settings.backups_about")}
                                </FieldDescription>
                              </FieldContent>
                              <Switch
                                id="switch-use-backups"
                                defaultChecked={formData.useBackup}
                                onCheckedChange={(checked) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    useBackup: checked,
                                  }))
                                }
                              />
                            </Field>
                          </FieldLabel>
                        </FieldGroup>

                        <AnimatePresence>
                          {formData.useBackup && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="grid gap-2 overflow-hidden"
                            >
                              <Label htmlFor="backupCount">
                                {t("settings.backups_count")}
                              </Label>
                              <Select
                                value={String(formData.backupCount)}
                                onValueChange={(val) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    backupCount: Number(val),
                                  }))
                                }
                              >
                                <SelectTrigger id="backupCount">
                                  <SelectValue placeholder="Выберите количество" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">
                                    {t("setup.backup_count", { count: 3 })}
                                  </SelectItem>
                                  <SelectItem value="5">
                                    {t("setup.backup_count", { count: 5 })}
                                  </SelectItem>
                                  <SelectItem value="10">
                                    {t("setup.backup_count", { count: 10 })}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Field>
                          <FieldLabel className="bg-transparent">
                            Синхронизация
                          </FieldLabel>
                          <ToggleGroup
                            value={[syncMode]}
                            onValueChange={(value) =>
                              value[0] &&
                              setSyncMode(value[0] as syncModeValues)
                            }
                            variant="outline"
                            className={"grid grid-cols-3 gap-2"}
                            spacing={2}
                            size="lg"
                          >
                            <ToggleGroupItem
                              value="local"
                              aria-label="Light"
                              className="flex w-full h-16 flex-col items-center justify-center rounded-xl bg-muted/50"
                            >
                              <span className="leading-none font-light">
                                <Locate className="size-6" />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Локальный
                              </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="hybrid"
                              aria-label="Normal"
                              className="flex w-full h-16 flex-col items-center justify-center rounded-xl"
                            >
                              <span className="text-2xl leading-none font-normal">
                                <HeartHandshake className="size-6" />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Гибридный
                              </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="server"
                              aria-label="Medium"
                              className="flex w-full h-16 flex-col items-center justify-center rounded-xl"
                            >
                              <span className="text-2xl leading-none font-medium">
                                <ServerCog className="size-6" />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Сервер
                              </span>
                            </ToggleGroupItem>
                          </ToggleGroup>
                          <FieldDescription>
                            {syncMode === "local" && (
                              <p>
                                Вы выбрали локальный подход, мы будем брать файл
                                кластера с вашего пк.
                              </p>
                            )}

                            {syncMode === "hybrid" && (
                              <p>
                                Вы выбрали гибридный подход, мы будем обновлять
                                файл кластера с репозитории github. В случае
                                если она будет не доступна вы включим локальную
                                копию.
                              </p>
                            )}

                            {syncMode === "server" && (
                              <p>
                                Вы выбрали серверный подход, мы будем брать файл
                                кластера только с репозитории github.
                              </p>
                            )}
                          </FieldDescription>
                        </Field>
                      </div>
                    )}

                    {activeTab === "debug" && (
                      <div className="py-2 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {t("settings.debug_and_diagnostic")}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 px-3 py-1.5 rounded transition font-medium flex items-center gap-1"
                              onClick={onDiagnose}
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                              <span>{t("buttons.diagnostic")}</span>
                            </button>

                            {diagnosticInfo && (
                              <button
                                className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 p-1.5 rounded transition flex items-center gap-1 text-white/80"
                                onClick={handleCopy}
                                title="Скопировать JSON"
                              >
                                {copied ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {copied
                                    ? t("buttons.is_copy")
                                    : t("buttons.copy")}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {parsedInfo ? (
                          <div className="rounded-lg bg-[#101015] border border-white/10 p-3 text-xs font-mono max-h-[220px] overflow-y-auto space-y-1.5">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1 text-white/40">
                              <span>{t("common.time")}</span>
                              <span className="text-white/80">
                                {parsedInfo.timestamp}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                              <span className="text-white/40">
                                Tauri Backend
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    parsedInfo.testInvoke?.success
                                      ? "bg-emerald-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="text-white/90">
                                  {parsedInfo.testInvoke?.result ?? "N/A"}
                                </span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1 py-1 text-white/60 border-b border-white/5">
                              <div>
                                Tauri Env:{" "}
                                <span
                                  className={
                                    parsedInfo.isTauriEnvironment
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }
                                >
                                  {String(parsedInfo.isTauriEnvironment)}
                                </span>
                              </div>
                              <div>
                                Window:{" "}
                                <span
                                  className={
                                    parsedInfo.hasWindow
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }
                                >
                                  {String(parsedInfo.hasWindow)}
                                </span>
                              </div>
                              <div>
                                Internals:{" "}
                                <span
                                  className={
                                    parsedInfo.hasTauriInternals
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }
                                >
                                  {String(parsedInfo.hasTauriInternals)}
                                </span>
                              </div>
                              <div>
                                Global:{" "}
                                <span
                                  className={
                                    parsedInfo.hasTauriGlobal
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }
                                >
                                  {String(parsedInfo.hasTauriGlobal)}
                                </span>
                              </div>
                            </div>

                            <div className="pt-1 text-[10px] text-white/40 truncate">
                              <span className="text-white/20">UA:</span>{" "}
                              {parsedInfo.userAgent}
                            </div>
                          </div>
                        ) : (
                          <pre className="rounded-lg bg-[#101015] border border-white/10 p-3 text-xs font-mono text-white/60 overflow-x-auto">
                            {diagnosticInfo ?? "Нет данных."}
                          </pre>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </motion.div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="btn back flex items-center gap-1 text-sm mb-4"
            onClick={onClose}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t("buttons.back")}</span>
          </button>
          <div className="px-1">
            <h3 className="text-lg font-semibold mb-2">Настройки приложения</h3>
            <p className="text-sm text-white/60 mb-4">
              Здесь вы можете настроить параметры приложения.
            </p>

            <div className="flex flex-col items-center justify-center p-6 bg-red-600/5 border border-red-600/20 rounded-2xl mb-6 mt-3">
              <h3 className="text-xl font-bold text-white text-center">
                Временно недоступно
              </h3>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
