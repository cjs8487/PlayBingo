import { Box } from '@mui/material';
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { RoomContext } from '../../context/RoomContext';
import Cell from './Cell';

export default function Board() {
    const { board, revealCard } = useContext(RoomContext);

    const ref = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const { width, height } = useWindowSize();
    useLayoutEffect(() => {
        setContainerWidth(ref.current?.clientWidth ?? 0);
        setContainerHeight(ref.current?.clientHeight ?? 0);
    }, [width, height]);

    if (board.hidden) {
        return (
            <Box
                ref={ref}
                sx={{
                    width: `${containerWidth}px`,
                    maxWidth: '100%',
                    height: `${containerHeight}px`,
                    maxHeight: '100%',
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    ':hover': {
                        background: (theme) => theme.palette.action.hover,
                    },
                }}
                onClick={revealCard}
            >
                Click to reveal card
            </Box>
        );
    }

    if (!board.board || !board.board[0]) {
        return null;
    }

    const rows = board.board.length;
    const cols = board.board[0].length;
    const cellSize = Math.min(containerWidth / cols, containerHeight / rows);

    return (
        <Box
            ref={ref}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <Box
                sx={{
                    width: `${cellSize * cols}px`,
                    minWidth: '400px',
                    maxWidth: '100%',
                    height: `${cellSize * rows}px`,
                    minHeight: '400px',
                    maxHeight: '100%',
                    border: 1,
                    borderColor: 'divider',
                    display: 'grid',
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                }}
            >
                {board.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <Cell
                            key={
                                cell.revealed
                                    ? cell.goal.id
                                    : 'hidden-' + rowIndex + '-' + colIndex
                            }
                            row={rowIndex}
                            col={colIndex}
                            goal={cell.revealed ? cell.goal.goal : undefined}
                            description={
                                cell.revealed
                                    ? cell.goal.description
                                    : undefined
                            }
                            difficulty={
                                cell.revealed
                                    ? (cell.goal.difficulty ?? undefined)
                                    : undefined
                            }
                            categories={
                                cell.revealed ? cell.goal.categories : undefined
                            }
                            completedPlayers={cell.completedPlayers}
                            revealed={cell.revealed}
                        />
                    )),
                )}
            </Box>
        </Box>
    );
}
