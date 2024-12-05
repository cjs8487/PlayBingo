import { Goal } from '@prisma/client';
import { shuffle } from '../../util/Array';

const lineCheckList: number[][] = [];
lineCheckList[1] = [1, 2, 3, 4, 5, 10, 15, 20, 6, 12, 18, 24];
lineCheckList[2] = [0, 2, 3, 4, 6, 11, 16, 21];
lineCheckList[3] = [0, 1, 3, 4, 7, 12, 17, 22];
lineCheckList[4] = [0, 1, 2, 4, 8, 13, 18, 23];
lineCheckList[5] = [0, 1, 2, 3, 8, 12, 16, 20, 9, 14, 19, 24];
lineCheckList[6] = [0, 10, 15, 20, 6, 7, 8, 9];
lineCheckList[7] = [0, 12, 18, 24, 5, 7, 8, 9, 1, 11, 16, 21];
lineCheckList[8] = [5, 6, 8, 9, 2, 12, 17, 22];
lineCheckList[9] = [4, 12, 16, 20, 9, 7, 6, 5, 3, 13, 18, 23];
lineCheckList[10] = [4, 14, 19, 24, 8, 7, 6, 5];
lineCheckList[11] = [0, 5, 15, 20, 11, 12, 13, 14];
lineCheckList[12] = [1, 6, 16, 21, 10, 12, 13, 14];
lineCheckList[13] = [
    0, 6, 12, 18, 24, 20, 16, 8, 4, 2, 7, 17, 22, 10, 11, 13, 14,
];
lineCheckList[14] = [3, 8, 18, 23, 10, 11, 12, 14];
lineCheckList[15] = [4, 9, 19, 24, 10, 11, 12, 13];
lineCheckList[16] = [0, 5, 10, 20, 16, 17, 18, 19];
lineCheckList[17] = [15, 17, 18, 19, 1, 6, 11, 21, 20, 12, 8, 4];
lineCheckList[18] = [15, 16, 18, 19, 2, 7, 12, 22];
lineCheckList[19] = [15, 16, 17, 19, 23, 13, 8, 3, 24, 12, 6, 0];
lineCheckList[20] = [4, 9, 14, 24, 15, 16, 17, 18];
lineCheckList[21] = [0, 5, 10, 15, 16, 12, 8, 4, 21, 22, 23, 24];
lineCheckList[22] = [20, 22, 23, 24, 1, 6, 11, 16];
lineCheckList[23] = [2, 7, 12, 17, 20, 21, 23, 24];
lineCheckList[24] = [20, 21, 22, 24, 3, 8, 13, 18];
lineCheckList[25] = [0, 6, 12, 18, 20, 21, 22, 23, 19, 14, 9, 4];

export const generateRandomTyped = (goalList: Goal[], seed?: number) => {
    const bingoBoard: Goal[] = [];

    let goals = goalList;
    shuffle(goals, seed);

    function checkLine(i: number, typesA: string[]) {
        let synergy = 0;
        for (let j = 0; j < lineCheckList[i].length; j++) {
            const typesB = bingoBoard[lineCheckList[i][j] + 1]?.categories;
            if (typeof typesA != 'undefined' && typeof typesB != 'undefined') {
                for (let k = 0; k < typesA.length; k++) {
                    for (let l = 0; l < typesB.length; l++) {
                        if (typesA[k] == typesB[l]) {
                            synergy++;
                            if (k == 0) {
                                synergy++;
                            }
                            if (l == 0) {
                                synergy++;
                            }
                        }
                    }
                }
            }
        }
        return synergy;
    }
    for (let i = 1; i <= 25; i++) {
        let j = 0,
            synergy = 0,
            currentObj: Goal,
            minSynObj: { synergy: number; value: Goal } | null = null;
        do {
            currentObj = goals[j];
            synergy = checkLine(i, currentObj.categories);
            if (minSynObj == null || synergy < minSynObj.synergy) {
                minSynObj = {
                    synergy: synergy,
                    value: currentObj,
                };
            }
            j++;
        } while (synergy != 0 && j < goals.length);
        bingoBoard[i] = minSynObj?.value;
        goals = goals.filter((g) => g.id !== minSynObj?.value.id);
    }
    return bingoBoard;
};

export const generateFullRandom = (goalList: Goal[], seed?: number) => {
    shuffle(goalList, seed);
    return goalList.splice(0, 25);
};
