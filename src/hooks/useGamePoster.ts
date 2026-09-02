import type { Game } from "@/types/cluster"
import { useEffect, useState } from "react"

export function useGamePoster(game: Game | undefined) {
  const getDefaultPoster = (g?: Game) => {
    if (g?.posters && g.posters.length > 0) {
      return g.posters[0];
    }
    const appId = g?.appId ?? "default";
    return `/Games/${appId}/posters/0.png`;
  };

  const [posterUrl, setPosterUrl] = useState<string>(() =>
    getDefaultPoster(game),
  );

  useEffect(() => {
    if (
      !game?.posters ||
      !Array.isArray(game.posters) ||
      game.posters.length === 0
    ) {
      setPosterUrl(getDefaultPoster(game));
      return;
    }

    const idx = Math.floor(Math.random() * game.posters.length);
    setPosterUrl(game.posters[idx]);
  }, [game]);

  return posterUrl;
}
