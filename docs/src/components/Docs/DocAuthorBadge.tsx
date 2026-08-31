// src/components/DocAuthorBadge.tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User } from "lucide-react";

interface DocAuthorBadgeInterface {
  author: string;
  author_url: string | undefined;
}

export default function DocAuthorBadge({ author, author_url }: DocAuthorBadgeInterface) {
  return (
    <HoverCard>
      {author_url ? (
        <HoverCardTrigger
          delay={100}
          closeDelay={200}
          className={"pb-2"}
          render={
            <a
              href={author_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] inline-flex items-center gap-1 hover:underline cursor-pointer"
            />
          }
        >
          <User size={16} />
          {author}
        </HoverCardTrigger>
      ) : (
        <HoverCardTrigger delay={100} closeDelay={200} className={"pb-2"}>
          <span className="text-gray-300 font-medium inline-flex items-center gap-1">
            <User size={16} />
            {author}
          </span>
        </HoverCardTrigger>
      )}
      <HoverCardContent>Автор статьи</HoverCardContent>
    </HoverCard>
  );
}
