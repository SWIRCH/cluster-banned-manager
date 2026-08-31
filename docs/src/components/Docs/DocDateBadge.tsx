import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { TimerIcon } from "lucide-react";

interface DocDateBadgeInterface {
  date: string;
  locale: string;
}

export default function DocDateBadge({ date, locale }: DocDateBadgeInterface) {
  if (!date) return null;

  const formattedDate = new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <HoverCard>
      <HoverCardTrigger delay={100} closeDelay={200}>
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
          <TimerIcon className="w-4 h-4" />
          <time dateTime={date}>{formattedDate}</time>
        </div>
      </HoverCardTrigger>
      <HoverCardContent>Дата публикации статьи</HoverCardContent>
    </HoverCard>
  );
}
