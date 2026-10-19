import { cn } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

const MAX_DOMAINS_SHOWN = 4;

function formatDomains(list: string[]) {
  const shown = list.slice(0, MAX_DOMAINS_SHOWN).join(" ");
  const rest = list.length - MAX_DOMAINS_SHOWN;
  return rest > 0 ? `${shown} +${rest}` : shown;
}

type Groups = { blocked: string[]; unBlocked: string[]; count: number };
const EMPTY: Groups = { blocked: [], unBlocked: [], count: 0 };

/**
 * Делит расхождения на «будут заблокированы» / «будут разблокированы».
 *
 * Защита от гонки: allBlockedDomains обновляется сразу, а mismatchDomains
 * приходит позже (после проверки hosts). Пока они не совпали, домен может
 * на секунду «перепрыгнуть» из одной группы в другую.
 *
 * Класс домена определяется тем, что реально лежит в hosts, а оно не меняется
 * до применения. Значит, если за одну сессию расхождений домен сменил группу,
 * пользователь просто вернул всё как было, и это уже не изменение — прячем его.
 *
 * Сессия = пока active === true. После применения/отмены (active → false) сбрасывается.
 */
export function useMismatchGroups(
  allBlockedDomains: string[] | null,
  mismatchDomains: string[],
  active: boolean,
) {
  const firstClass = useRef(new Map<string, "block" | "unblock">());
  const last = useRef<Groups>(EMPTY);

  const current = useMemo<Groups>(() => {
    if (!active) {
      firstClass.current.clear();
      return EMPTY;
    }

    const desired = new Set(allBlockedDomains ?? []);
    const blocked: string[] = [];
    const unBlocked: string[] = [];

    for (const domain of mismatchDomains) {
      const cls = desired.has(domain) ? "block" : "unblock";
      const first = firstClass.current.get(domain);

      if (first === undefined) firstClass.current.set(domain, cls);
      else if (first !== cls) continue; // вернули обратно — изменения нет

      (cls === "block" ? blocked : unBlocked).push(domain);
    }

    return { blocked, unBlocked, count: blocked.length + unBlocked.length };
  }, [active, allBlockedDomains, mismatchDomains]);

  const open = active && current.count > 0;
  if (open) last.current = current;

  // Пока блок сворачивается, показываем последний непустой список,
  // чтобы текст не исчезал раньше высоты.
  const groups = open ? current : last.current;
  return { ...groups, open };
}

/**
 * Одна строка «домены + подпись». Не размонтируется, а плавно сворачивается
 * (grid-template-rows 0fr ↔ 1fr); пока сворачивается — показывает прошлый текст.
 */
function DomainLine({
  domains,
  suffix,
}: {
  domains: string[];
  suffix: (count: number) => string;
}) {
  const open = domains.length > 0;
  const last = useRef(domains);
  if (open) last.current = domains;
  const list = open ? domains : last.current;

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
    >
      <p className="min-h-0 overflow-hidden break-words">
        {formatDomains(list)} {suffix(list.length)}
      </p>
    </div>
  );
}

export function MismatchLines({
  blocked,
  unBlocked,
  className,
}: {
  blocked: string[];
  unBlocked: string[];
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <DomainLine
        domains={blocked}
        suffix={(count) => t("system.hosts.will_be_blocked", { count })}
      />
      <DomainLine
        domains={unBlocked}
        suffix={(count) => t("system.hosts.will_be_unblocked", { count })}
      />
    </div>
  );
}
