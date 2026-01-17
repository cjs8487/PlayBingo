import { Box } from '@mui/material';
import { useContext } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { RoomContext } from '../../context/RoomContext';
import Cell from './Cell';

export default function Board() {
    const { board, revealCard } = useContext(RoomContext);

    const rows = board.height;
    const cols = board.width;

    return (
        <Box
            sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
            }}
        >
            <Box
                sx={{
                    flex: '1 1 auto',
                    height: '100%',
                    textAlign: 'center',
                }}
            >
                <AutoSizer>
                    {({ width, height }) => {
                        // Maintain square cells by constraining board size
                        const aspectRatio = cols / rows;
                        let boardWidth = width;
                        let boardHeight = width / aspectRatio;
                        let leftMargin = 0;
                        let topMargin = 0;

                        // Only constrain by height if board would exceed available height
                        // and we have enough width to maintain a reasonable board size
                        if (boardHeight > height && width > 400) {
                            boardHeight = height;
                            boardWidth = height * aspectRatio;
                        }

                        // Ensure minimum board dimensions for usability
                        const minBoardSize = Math.min(300, width);
                        if (boardWidth < minBoardSize) {
                            boardWidth = minBoardSize;
                            boardHeight = minBoardSize / aspectRatio;
                        }

                        if (boardWidth < width) {
                            leftMargin = (width - boardWidth) / 2;
                        }

                        if (boardHeight < height) {
                            topMargin = (height - boardHeight) / 2;
                        }

                        if (board.hidden) {
                            return (
                                <Box
                                    sx={{
                                        width: boardWidth,
                                        height: boardHeight,
                                        ml: `${leftMargin}px`,
                                        mt: `${topMargin}px`,
                                        border: 1,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        ':hover': {
                                            background: (theme) =>
                                                theme.palette.action.hover,
                                        },
                                    }}
                                    onClick={revealCard}
                                >
                                    Click to reveal card
                                </Box>
                            );
                        }

                        return (
                            <Box
                                sx={{
                                    width: boardWidth,
                                    height: boardHeight,
                                    display: 'grid',
                                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    ml: `${leftMargin}px`,
                                    mt: `${topMargin}px`,
                                }}
                            >
                                {board.board.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => (
                                        <Cell
                                            key={
                                                cell.revealed
                                                    ? cell.goal.id
                                                    : 'hidden-' +
                                                      rowIndex +
                                                      '-' +
                                                      colIndex
                                            }
                                            row={rowIndex}
                                            col={colIndex}
                                            goal={
                                                cell.revealed
                                                    ? cell.goal.goal
                                                    : undefined
                                            }
                                            description={
                                                cell.revealed
                                                    ? cell.goal.description
                                                    : undefined
                                            }
                                            difficulty={
                                                cell.revealed
                                                    ? (cell.goal.difficulty ??
                                                      undefined)
                                                    : undefined
                                            }
                                            categories={
                                                cell.revealed
                                                    ? cell.goal.categories
                                                    : undefined
                                            }
                                            completedPlayers={
                                                cell.completedPlayers
                                            }
                                            revealed={cell.revealed}
                                        />
                                    )),
                                )}
                            </Box>
                        );
                    }}
                </AutoSizer>
            </Box>
        </Box>
    );
}
