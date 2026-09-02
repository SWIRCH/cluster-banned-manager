import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import path from "path";
import remarkEmoji from "remark-emoji";
import remarkGithubAlerts from "remark-github-alerts";
import sitemap from "@astrojs/sitemap";

const unifiedProcessor = unified({
  syntaxHighlight: "prism",
  gfm: true,
  remarkPlugins: [remarkGithubAlerts, remarkEmoji],
});

export default defineConfig({
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        if (page === "https://cbmwot.vercel.app") {
          return true;
        }

        return page.includes("/docs/ru/") || page.includes("/docs/en/");
      },

      i18n: {
        defaultLocale: "ru",
        locales: {
          ru: "ru",
          en: "en",
        },
      },
    }),
  ],
  site: "https://cbmwot.vercel.app",
  // base: "/cluster-banned-manager",

  markdown: {
    processor: unifiedProcessor,
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
