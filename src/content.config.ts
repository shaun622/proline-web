import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each markdown file under src/content/services becomes one service detail
// page at /services/<filename>. Frontmatter is the source of truth for the
// service card on the home page, the detail page, and the per-service JSON-LD.
const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    // Card / nav
    title: z.string(),
    summary: z.string(),
    icon: z.enum(['repair', 'glass', 'glazing', 'handle', 'lock', 'maintenance']),
    order: z.number(),

    // SEO
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()).default([]),

    // Detail page content
    h1: z.string(),
    lead: z.string(),
    fixesHeading: z.string().default('What we fix'),
    fixes: z.array(z.string()),
    signsHeading: z.string().default('Signs you need this'),
    signs: z.array(z.string()),
    processHeading: z.string().default('How it works'),
    process: z.array(
      z.object({
        step: z.string(),
        detail: z.string(),
      })
    ),
    pricing: z.string().optional(),
    faqs: z.array(
      z.object({
        q: z.string(),
        a: z.string(),
      })
    ),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { services };
