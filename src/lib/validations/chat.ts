import { z } from "zod";

export const createConversationSchema = z.object({
  mentor_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().default("New Conversation"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
