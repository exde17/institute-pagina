import { defineCollection, z } from 'astro:content';

const noticias = defineCollection({
  type: 'content',
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    fecha: z.string(), // ISO: "2025-09-01"
    cover: z.string().optional(),
    destacado: z.boolean().optional()
  }),
});

export const collections = { noticias };
