import type { ReleaseData } from "@/lib/github";
import { getGitHubLastRelease } from "@/lib/github";
import { config } from "@/utils/config";
import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

export default function TopBanner() {
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRelease = async () => {
      try {
        const data = await getGitHubLastRelease();
        setRelease(data);
      } catch (error) {
        console.error("Failed to load release:", error);
      } finally {
        getShortBodyLine();
        setLoading(false);
      }
    };

    loadRelease();
  }, []);

  const getShortBodyLine = () => {
    const marker = "a4c1:";

    if (!release) return <Spinner />;
    if (loading) return <Spinner />;

    if (!release.body || !release.body.includes(marker)) {
      return "No data";
    }

    const contentAfter = release.body.split(marker)[1];

    if (contentAfter) return contentAfter.trim();

    return "No data";
  };

  return (
    <div className="top-banner flex justify-center rounded-sm border-b border-white/2">
      <a
        href={config.RELEASE_URL}
        className="alert border-white/5 bg-transparent hover:bg-white/1 flex w-full justify-center rounded-none border-x-0 border-t-0 p-2 text-center text-xs shadow-none transition-colors"
      >
        <div className="font-mono text-[0.6875rem] inline-flex gap-2.5 items-center">{getShortBodyLine()}</div>
      </a>
    </div>
  );
}
