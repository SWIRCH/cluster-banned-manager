import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    keywords: z.string().optional(),
    author: z.string().optional(),
    author_link: z.string().optional(),
    priority: z.number().optional(),
  }),
});

export const collections = { docs };
