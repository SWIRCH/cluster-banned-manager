import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import path from "path";
import remarkEmoji from "remark-emoji";
import remarkGithubAlerts from "remark-github-alerts";

const unifiedProcessor = unified({
  syntaxHighlight: "prism",
  gfm: true,
  remarkPlugins: [remarkGithubAlerts, remarkEmoji],
});

export default defineConfig({
  integrations: [react(), mdx()],
  site: "https://github.io",
  base: "/cluster-banned-manager",

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
