import { z } from 'zod';

export const Variant = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    generatorSettings: z.any().optional(),
});

export type Variant = z.infer<typeof Variant>;
