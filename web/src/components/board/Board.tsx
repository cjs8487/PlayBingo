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
                p: 1,
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
                        // Maintain square cells by constraining to smallest dimension
                        const aspectRatio = cols / rows;
                        let boardWidth = width;
                        let boardHeight = width / aspectRatio;
                        let leftMargin = 0;
                        let topMargin = 0;

                        if (boardHeight > height) {
                            boardHeight = height;
                            boardWidth = height * aspectRatio;
                        }

                        if (boardWidth < width) {
                            leftMargin = (width - boardWidth) / 2;
                        }

                        if (boardWidth < height) {
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
                                                    ? cell.goal
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
