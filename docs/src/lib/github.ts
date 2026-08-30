const STORAGE_KEY = "github-last-release";
const CACHE_DURATION = 1000 * 60 * 60;

export interface ReleaseData {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

export interface CachedData {
  data: ReleaseData;
  timestamp: number;
}

export async function fetchGitHubLastRelease(): Promise<ReleaseData | null> {
  try {
    const response = await fetch("https://api.github.com/repos/SWIRCH/cluster-banned-manager/releases/latest");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch release:", error);
    throw error;
  }
}

export async function getGitHubLastRelease(): Promise<ReleaseData | null> {
  const cached = getCachedRelease();

  if (cached) {
    return cached;
  }

  try {
    const data = await fetchGitHubLastRelease();
    saveCachedRelease(data);
    return data;
  } catch (error) {
    console.error("Failed to get release:", error);
    return null;
  }
}

function getCachedRelease(): ReleaseData | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > CACHE_DURATION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Failed to read cache:", error);
    return null;
  }
}

function saveCachedRelease(data: any): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error("Failed to save cache:", error);
  }
}
