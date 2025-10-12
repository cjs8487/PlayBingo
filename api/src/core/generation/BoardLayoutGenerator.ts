import { GeneratorSettings } from '@playbingo/shared';
import BoardGenerator, { LayoutCell } from './BoardGenerator';

type BoardLayout = GeneratorSettings['boardLayout'];

export type BoardLayoutGenerator = (generator: BoardGenerator) => void;

export const createLayoutGenerator = (strategy: BoardLayout) => {
    switch (strategy.mode) {
        case 'random':
            return noLayout;
        case 'srlv5':
            return magicSquare;
        case 'isaac':
            return staticDifficulty;
        case 'custom':
            return custom;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noLayout: BoardLayoutGenerator = (generator) => {
    generator.layout = new Array(5).fill(
        Array(5).fill({ selectionCriteria: 'random' }),
    );
};

const magicSquareValue = (i: number, seed: number) => {
    let Num3 = seed % 1000;
    let Rem8 = Num3 % 8;
    let Rem4 = Math.floor(Rem8 / 2);
    let Rem2 = Rem8 % 2;
    let Rem5 = Num3 % 5;
    let Rem3 = Num3 % 3;
    let RemT = Math.floor(Num3 / 120);
    const Table5 = [0];
    Table5.splice(Rem2, 0, 1);
    Table5.splice(Rem3, 0, 2);
    Table5.splice(Rem4, 0, 3);
    Table5.splice(Rem5, 0, 4);
    Num3 = Math.floor(seed / 1000);
    Num3 = Num3 % 1000;
    Rem8 = Num3 % 8;
    Rem4 = Math.floor(Rem8 / 2);
    Rem2 = Rem8 % 2;
    Rem5 = Num3 % 5;
    Rem3 = Num3 % 3;
    RemT = RemT * 8 + Math.floor(Num3 / 120);
    const Table1 = [0];
    Table1.splice(Rem2, 0, 1);
    Table1.splice(Rem3, 0, 2);
    Table1.splice(Rem4, 0, 3);
    Table1.splice(Rem5, 0, 4);
    i--;
    RemT = RemT % 5;
    const x = (i + RemT) % 5;
    const y = Math.floor(i / 5);
    const e5 = Table5[(x + 3 * y) % 5];
    const e1 = Table1[(3 * x + y) % 5];
    let value = 5 * e5 + e1;
    // if (MODE == 'short') {
    //     value = Math.floor(value / 2);
    // } else if (MODE == 'long') {
    //     value = Math.floor((value + 25) / 2);
    // }
    value++;
    return value;
};

const magicSquare: BoardLayoutGenerator = (generator) => {
    for (let r = 0; r < 5; r++) {
        generator.layout[r] = [];
        for (let c = 0; c < 5; c++) {
            generator.layout[r][c] = {
                selectionCriteria: 'difficulty',
                difficulty: magicSquareValue(r * 5 + c + 1, generator.seed),
            };
        }
    }
};

const staticDifficulty: BoardLayoutGenerator = (generator) => {
    const one: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 1 };
    const two: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 2 };
    const three: LayoutCell = {
        selectionCriteria: 'difficulty',
        difficulty: 3,
    };
    const four: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 4 };
    generator.layout = [
        [two, three, one, one, two],
        [three, one, two, two, one],
        [one, two, four, two, one],
        [two, one, two, one, three],
        [one, two, one, three, two],
    ];
};

const custom: BoardLayoutGenerator = (generator) => {
    if (!generator.customBoardLayout) {
        throw new Error('Custom board layout not provided');
    }
    generator.layout = generator.customBoardLayout;
};
