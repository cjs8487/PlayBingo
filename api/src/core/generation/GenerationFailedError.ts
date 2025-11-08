import BoardGenerator from './BoardGenerator';

export class GenerationFailedError extends Error {
    public readonly failureReason: string;
    public readonly generatorState: BoardGenerator;

    constructor(
        failureReason: string,
        generatorState: BoardGenerator,
        boardIndex: number = -1,
    ) {
        super();

        this.failureReason = failureReason;
        this.generatorState = generatorState;

        let message = `Board generation failed - ${failureReason}.`;
        if (boardIndex >= 0) {
            message += ` This error occurred while attempting to place a goal at row ${Math.floor(boardIndex / 5) + 1}, column ${(boardIndex % 5) + 1}.`;
        }

        this.message = message;
    }
}
