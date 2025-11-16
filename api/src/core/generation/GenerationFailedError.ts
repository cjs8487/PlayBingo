import { BoardGenerator, LayoutCell } from './BoardGenerator';

export class GenerationFailedError extends Error {
    public readonly failureReason: string;
    public readonly generatorState: BoardGenerator;

    constructor(
        failureReason: string,
        generatorState: BoardGenerator,
        rowIndex: number = -1,
        colIndex: number = -1,
        layoutCell?: LayoutCell,
    ) {
        super();

        this.failureReason = failureReason;
        this.generatorState = generatorState;

        let message = `Board generation failed - ${failureReason}.`;
        if (rowIndex >= 0 && colIndex >= 0) {
            message += ` This error occurred while attempting to place a goal at row ${rowIndex + 1}, column ${colIndex + 1}.`;
        }

        if (layoutCell) {
            message += ` The cell had the following layout data ${JSON.stringify(layoutCell)}`;
        }

        this.message = message;
    }
}
