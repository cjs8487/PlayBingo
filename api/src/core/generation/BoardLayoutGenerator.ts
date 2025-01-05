import { GenerationBoardLayout } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type BoardLayoutGenerator = (generator: BoardGenerator) => void;

export const createLayoutGenerator = (strategy: GenerationBoardLayout) => {
    switch (strategy) {
        case 'NONE':
            return noLayout;
        case 'SRLv5':
            return magicSquare;
        case 'ISAAC':
            return staticDifficulty;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noLayout: BoardLayoutGenerator = (generator) => {
    generator.layout = new Array(25).fill(0);
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
    for (let i = 0; i < 25; i++) {
        generator.layout[i] = magicSquareValue(i + 1, generator.seed);
    }
};

const staticDifficulty: BoardLayoutGenerator = (generator) => {
    throw Error('Not implemented');
};
