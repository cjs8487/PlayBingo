import { Board, Cell } from '@playbingo/types';

type BoardEvent =
    | {
          action: 'cell';
          row: number;
          col: number;
          cell: Cell;
      }
    | {
          action: 'board';
          board: Board;
      };

let board: Board = { board: [], width: 5, height: 5 };
let listeners: (() => void)[] = [];

export const subscribeToBoardUpdates = (listener: () => void) => {
    listeners = [...listeners, listener];
    return () => {
        listeners = listeners.filter((l) => l !== listener);
    };
};

export const emitBoardUpdate = (event: BoardEvent) => {
    switch (event.action) {
        case 'board':
            board = event.board;
            break;
        case 'cell': {
            if (board.hidden) {
                break;
            }
            const newCells = board.board.map((row) => row.map((cell) => cell));
            newCells[event.row][event.col] = event.cell;
            board = {
                board: newCells,
                width: board.width,
                height: board.height,
            };
            break;
        }
    }
    listeners.forEach((listener) => {
        listener();
    });
};

export const getBoardSnapshot = () => board;

const serverSnapshot = { board: [], width: 5, height: 5 };
export const getServerSnapshot = () => serverSnapshot;
