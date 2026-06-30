import { z } from "zod";

const messageTypeSchema = z.enum(["TEXT", "IMAGE", "AUDIO", "GIF", "SYSTEM"]);

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  type: messageTypeSchema.default("TEXT"),
  text: z.string().max(4000).optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  replyToId: z.string().optional(),
});

export const editMessageSchema = z.object({
  text: z.string().min(1).max(4000),
});

export const deleteMessageSchema = z.object({
  scope: z.enum(["self", "everyone"]),
});

export const reactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(8),
});

export const conversationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().max(100).optional(),
});

export const messageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
