import { z } from 'zod';

const CommonFields = z.object({
    authToken: z.string(),
});

const JoinAction = z.object({
    action: z.literal('join'),
    payload: z.object({
        nickname: z.string(),
    }),
});

const allActions = [JoinAction].map((action) =>
    z.object({
        ...action.shape,
        ...CommonFields.shape,
    }),
);

export const RoomAction = z.discriminatedUnion('action', [
    z.object({
        ...z.object({
            action: z.literal('join'),
            payload: z
                .object({
                    nickname: z.string(),
                })
                .optional(),
        }).shape,
        ...CommonFields.shape,
    }),
    z.object({
        ...z.object({
            action: z.literal('leave'),
        }).shape,
        ...CommonFields.shape,
    }),
    z.object({
        ...z.object({
            action: z.literal('chat'),
            payload: z.object({
                message: z.string(),
            }),
        }).shape,
        ...CommonFields.shape,
    }),
    z.object({
        ...z.object({
            action: z.literal('mark'),
            payload: z.object({
                row: z.number(),
                col: z.number(),
            }),
        }).shape,
        ...CommonFields.shape,
    }),
    z.object({
        ...z.object({
            action: z.literal('unmark'),
            payload: z.object({
                row: z.number(),
                col: z.number(),
            }),
        }).shape,
        ...CommonFields.shape,
    }),
]);

export type RoomAction = z.infer<typeof RoomAction>;
