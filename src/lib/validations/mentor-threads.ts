import { z } from "zod";

export const createThreadSchema = z.object({
  title: z.string().optional().default("New Thread"),
  mentor_ids: z.array(z.string().uuid()).min(2).max(3),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const sendThreadMessageSchema = z.object({
  thread_id: z.string().uuid(),
  content: z.string().min(1),
});

export type SendThreadMessageInput = z.infer<typeof sendThreadMessageSchema>;

export const processThreadMessageSchema = z.object({
  thread_id: z.string().uuid(),
  mentor_ids: z.array(z.string().uuid()).min(1),
});

export type ProcessThreadMessageInput = z.infer<typeof processThreadMessageSchema>;
