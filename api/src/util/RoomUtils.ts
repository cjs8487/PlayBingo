import { chunk } from './Array';
import { GeneratorGoal } from '../core/generation/GeneratorCore';

export const listToBoard = (list: GeneratorGoal[]) => {
    return chunk(
        list.map((g) => ({
            goal: `${g.goal}`,
            description: g.description ?? '',
            colors: [],
        })),
        5,
    );
};
