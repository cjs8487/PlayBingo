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

        let message = `Failed to generate board - ${failureReason}. `;
        if (boardIndex >= 0) {
            message += `This error occurred while attempting to place a goal at row ${Math.floor(boardIndex / 5) + 1}, column ${(boardIndex % 5) + 1}.`;
        } else {
            message += 'This error occurred prior to placing the first goal.';
        }

        this.message = message;
    }
}
