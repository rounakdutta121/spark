import { z } from "zod";

export const createStoryCommentSchema = z.object({
  text: z.string().min(1).max(500),
});

export const storyCommentQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
