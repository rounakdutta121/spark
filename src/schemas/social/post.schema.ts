import { z } from "zod";

export const createPostSchema = z.object({
  caption: z.string().max(2200).optional(),
  location: z.string().max(120).optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  altTexts: z.array(z.string().max(500)).optional(),
});

export const createPostMediaItemSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  altText: z.string().max(500).optional(),
});

export const createPostJsonSchema = createPostSchema.extend({
  media: z.array(createPostMediaItemSchema).min(1).max(10),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

export const exploreQuerySchema = feedQuerySchema.extend({
  q: z
    .string()
    .max(100)
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(["users", "posts", "hashtags", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});
