const board = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
];

export function App() {
    console.log(board);
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'purple',
            }}
        >
            {board.map((row, x) => (
                <div
                    style={{
                        width: '100%',
                        flexGrow: 1,
                        display: 'flex',
                        backgroundColor: 'green',
                        borderCollapse: 'collapse',
                    }}
                >
                    {row.map((cell, y) => (
                        <div
                            style={{
                                flexGrow: 1,
                                border: '1px solid black',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >{`${x},${y}`}</div>
                    ))}
                </div>
            ))}
        </div>
    );
}
