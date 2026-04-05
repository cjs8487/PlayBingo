import * as z from 'zod';
import { preprocessNumber } from './ValidationUtils';

export const roomCreateSchema = z
    .object({
        name: z.string().nonempty('Room name is required'),
        password: z.string().nonempty('Password is required'),
        nickname: z.string().nonempty('Player nickname is required'),
        game: z.string().nonempty('Game is required'),
        variant: z.string().optional(),
        mode: z.enum(['LINES', 'BLACKOUT', 'LOCKOUT'], 'Invalid game mode'),
        lineCount: preprocessNumber(z.number().min(1)),
        seed: preprocessNumber(z.number().optional()),
        hideCard: z.stringbool().optional(),
        spectator: z.stringbool().optional(),
        exploration: z.stringbool().optional(),
        explorationStart: z.preprocess(
            (val: string) => {
                if (!val) {
                    return undefined;
                }
                return val;
            },
            z
                .enum(
                    ['TL', 'TR', 'BL', 'BR', 'CENTER', 'RANDOM'],
                    'Invalid starting square',
                )
                .optional(),
        ),
        explorationStartCount: preprocessNumber(
            z.int().min(1).max(5).optional(),
        ),
    })
    .refine(
        (data) => {
            if (data.exploration && !data.explorationStart) {
                return false;
            }
            return true;
        },
        { error: 'Starting Square is required.', path: ['explorationStart'] },
    )
    .refine(
        (data) => {
            if (
                data.exploration &&
                data.explorationStart === 'RANDOM' &&
                !data.explorationStartCount
            ) {
                return false;
            }
            return true;
        },
        { error: 'Start count is required.', path: ['explorationStartCount'] },
    );

export type RoomCreateFormData = z.infer<typeof roomCreateSchema>;
