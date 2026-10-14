import type { ReleaseData } from "@/lib/github"
import { getGitHubLastRelease } from "@/lib/github"
import { config } from "@/utils/config"
import { useEffect, useState } from "react"
import { Spinner } from "./ui/spinner"

const NO_DATA = "No data";
const BANNER_PATTERN = /<!--\s*a4c1:\s*([\s\S]*?)\s*-->/;

function extractBannerText(release: ReleaseData | null): string {
  const match = release?.body?.match(BANNER_PATTERN);
  return match?.[1]?.trim() || NO_DATA;
}

export default function TopBanner() {
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRelease = async () => {
      try {
        const data = await getGitHubLastRelease();
        if (!cancelled) setRelease(data);
      } catch (error) {
        console.error("Failed to load release:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRelease();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="top-banner flex justify-center rounded-sm border-b border-white/2">
      <a
        href={config.RELEASE_URL}
        className="alert border-white/5 bg-transparent hover:bg-white/1 flex w-full justify-center rounded-none border-x-0 border-t-0 p-2 text-center text-xs shadow-none transition-colors"
      >
        <div className="font-mono text-[0.6875rem] inline-flex gap-2.5 items-center">
          {loading ? <Spinner /> : extractBannerText(release)}
        </div>
      </a>
    </div>
  );
}