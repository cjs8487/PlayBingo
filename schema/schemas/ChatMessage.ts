import { z } from 'zod';

const MessageSement = z.union([
    z.string(),
    z.object({
        contents: z.string(),
        color: z.string(),
    }),
]);

export const ChatMessage = z.array(MessageSement);

export type ChatMessage = z.infer<typeof ChatMessage>;
