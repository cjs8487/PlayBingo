import { useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
import Cell from './Cell';
import { Box } from '@mui/material';

export default function Board() {
    const { board, revealCard } = useContext(RoomContext);

    if (board.hidden) {
        return (
            <Box
                sx={{
                    aspectRatio: '1 / 1',
                    maxHeight: '100%',
                    maxWidth: '100%',
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

    return (
        <Box
            sx={{
                aspectRatio: '1 / 1',
                maxHeight: '100%',
                maxWidth: '100%',
                border: 1,
                borderColor: 'divider',
            }}
        >
            {board.board.map((row, rowIndex) => (
                <Box
                    key={rowIndex}
                    sx={{
                        display: 'flex',
                        height: '20%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                    }}
                >
                    {row.map((goal, colIndex) => (
                        <Cell
                            key={goal.goal.id}
                            row={rowIndex}
                            col={colIndex}
                            cell={goal}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
}
