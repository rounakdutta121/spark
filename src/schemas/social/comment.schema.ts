import { z } from "zod";

export const createCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const commentQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
