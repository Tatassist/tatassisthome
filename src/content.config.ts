import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['pricing', 'deposits', 'client-qualification', 'professional-systems', 'coverups']),
    quickTake: z.string(),
    primaryCTA: z.enum(['calculator', 'toolkit', 'ebook']),
    secondaryCTA: z.enum(['calculator', 'toolkit', 'ebook']).optional(),
    ctaBridge: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    featured: z.boolean().default(false),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    relatedArticles: z.array(z.string()).optional(),
  }),
});

export const collections = { resources };
