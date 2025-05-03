import { GeneratorOptions } from '@playbingo/types';
import {
    GenerationBoardLayout,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
} from '@prisma/client';
import { Router } from 'express';

const config = Router();

config.get('/generator', (req, res) => {
    const generatorOptions: GeneratorOptions = {
        steps: [
            {
                displayName: 'List Selection',
                value: 'pruner',
                description:
                    'Determines what goals are available for the generator select from using the overall list for the game. At this time, no options are available for this and the generator will always utilize the full list of goals for the game.',
                required: false,
                selectMultiple: true,
                availableRules: [],
            },
            {
                displayName: 'Goal Transformation',
                value: 'transformer',
                description:
                    'Alters the data for each goal before generation. Currently, no options are available for this generation step and the generator will use the base values for all goals.',
                required: false,
                selectMultiple: false,
                availableRules: [],
            },
            {
                displayName: 'Board Layout',
                value: 'layout',
                description:
                    'Determines how goals are laid out on the bingo board, and how goals can be chosen in the next step of generation.',
                required: true,
                selectMultiple: false,
                availableRules: [
                    {
                        displayName: 'Random',
                        value: GenerationBoardLayout.NONE,
                        description:
                            'Generates a board layout that has no restrictions on what goals can be placed in any given cell',
                    },
                    {
                        displayName: 'Magic Square',
                        value: GenerationBoardLayout.SRLv5,
                        description:
                            'Generates a board using difficulties 1-25 to balance each line. Each difficulty appears on the board exactly once amd the sum of the difficulties in each line sums to the same value. Goals with an invalid difficulty will be ignored.',
                    },
                    {
                        displayName: 'Static (Isaac)',
                        value: GenerationBoardLayout.ISAAC,
                        description:
                            'Generates a board with a static layout using difficulties 1-4. The center cell of the board is always 4, and all sum of difficulties in lines including the center cell is 10. All other lines have a difficulty sum of 9. Goals with an invalid difficulty will be ignored.',
                    },
                ],
            },
            {
                displayName: 'Goal Selection',
                value: 'goalSelection',
                description:
                    'Determines how goals are selected from the pool of possible goals to be placed on the board. Selection mode determines how board layout is interpreted by the generator.',
                required: true,
                selectMultiple: false,
                availableRules: [
                    {
                        displayName: 'Random',
                        value: GenerationGoalSelection.RANDOM,
                        description:
                            'Selects goals completely at random. This is the only selection mode compatible with a random board layout. This selection mode is not compatible with any layout that requires goal difficulties.',
                    },
                    {
                        displayName: 'Difficulty',
                        value: GenerationGoalSelection.DIFFICULTY,
                        description:
                            'Selects goals based on their difficulty, placing them only in cells with a matching value from layout generation. Incompatible with random board layouts.',
                    },
                ],
            },
            {
                displayName: 'Cell Restrictions',
                value: 'cellRestriction',
                description:
                    'Applies additional restrictions on cells, which prevents the placement of otherwise valid goals in the cell.',
                required: false,
                selectMultiple: true,
                availableRules: [
                    {
                        displayName: 'Line Type Exclusion',
                        value: GenerationGoalRestriction.LINE_TYPE_EXCLUSION,
                        description:
                            'Utilizes goal gategories to minimize the synergy in each line by minimizing hte total overlap of categories in the line. With this restriction, a goal with the minimum possible overlap will be placed in each cell.',
                    },
                ],
            },
            {
                displayName: 'Global Adjustments',
                value: 'globalAdjsutments',
                description:
                    'Applies modifications after a goal is selected and placed in the board, which may affect the placement of future goals.',
                required: false,
                selectMultiple: true,
                availableRules: [
                    {
                        displayName: 'Synergize',
                        value: GenerationGlobalAdjustments.SYNERGIZE,
                        description:
                            'Increases the likelihood of a goal sharing one or more types with already placed goals being selected. After a goal is selected, the remaining goals that share a type are duplicated, resulting in a 2x chacne of selection. Goals which share multiple categories will have an even higher chance of selection.',
                    },
                    {
                        displayName: 'Category Maximums',
                        value: GenerationGlobalAdjustments.BOARD_TYPE_MAX,
                        description:
                            'Constrains the board to having a maximum number of goals with any given type. After a goal is placed, if any of its types have met its maximum, all goals with that category will be removed from the goal pool, preventing any more from being placed.',
                    },
                ],
            },
        ],
    };
    res.status(200).json(generatorOptions);
});

export default config;
