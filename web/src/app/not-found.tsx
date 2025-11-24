'use client';

import { Box, Link, Typography } from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import logo from '../../public/logo.png';
import Board from '../components/board/Board';
import Footer from '../components/footer/Footer';
import { ConnectionStatus, RoomContext } from '../context/RoomContext';
import theme from '../theme';

const mockBoard = {
    hidden: false,
    width: 5,
    height: 5,
    board: [
        ['Oops!', 'So Lost', 'Wow', 'Much Empty', 'Try Again'],
        ['Not Found', 'Woot', 'Where?', 'Still Empty', 'Lost Again'],
        ['Nothing Here', 'Uh-Oh!', '404', 'Dead End', 'Broken Link'],
        ['Wrong Turn', 'Go Back', 'Really?', 'Click Me', 'Out of Bounds'],
        ['Misstep', 'No Bingo', 'Whoops', 'Error!', 'Return Home'],
    ].map((row, rowIndex) =>
        row.map((text, colIndex) => ({
            goal: {
                id: `${rowIndex}:${colIndex}`,
                goal: text,
                description: '',
            },
            description: '',
            completedPlayers: text === '404' ? ['1'] : [],
            revealed: true,
        })),
    ),
};

const titles = [
    { title: 'Bingo!', subtitle: 'You found a 404!' },
    {
        title: 'Seems like you wrong warped.',
        subtitle: "The page you're looking for isn't here.",
    },
    {
        title: "It's dangerous to go alone",
        subtitle: 'Take this bingo for the journey home.',
    },
    {
        title: 'Looks like you found a softlock.',
        subtitle: 'Reload from your last save or head back to the start.',
    },
    {
        title: '404: Missing No.',
        subtitle:
            "This page doesn't exist, but maybe you can glitch your way back home.",
    },
    {
        title: "You've fallen out of the world!",
        subtitle:
            "You're in uncharted territor now, better head back before it's too late.",
    },
    {
        title: 'Critical miss!',
        subtitle: "You may have rolled poorly, but there's always next time",
    },
    {
        title: "This isn't the final boss.",
        subtitle: "The page you're looking for is in another castle.",
    },
    { title: '404: Game Over', subtitle: 'Continue or reset?' },
    {
        title: 'This is not the fastest route.',
        subtitle:
            'Navigate back to the main route to compete for the best time.',
    },
    {
        title: "The RNG wasn't in your favor.",
        subtitle: "The poage you're looking for must be a rare drop.",
    },
    { title: 'Wrong item equipped', subtitle: 'Try using a different URL.' },
    {
        title: 'This page has despawned',
        subtitle: 'Try another route to reach your goal.',
    },
    {
        title: 'This door is locked',
        subtitle: 'Head back and try to find another way in.',
    },
    {
        title: 'This page has been loading for a long time...',
        subtitle: 'Maybe your game crashed?',
    },
];

export default function NotFound() {
    const mockRoomContext = {
        connectionStatus: ConnectionStatus.CONNECTED,
        board: mockBoard,
        messages: [],
        color: '#000000',
        roomData: undefined,
        nickname: 'Guest',
        players: [],
        starredGoals: [],
        showGoalDetails: false,
        showCounters: false,
        colorMap: { '1': theme.palette.primary.dark },
        connect: async () => ({ success: true }),
        sendChatMessage: () => {},
        markGoal: () => {},
        unmarkGoal: () => {},
        changeColor: () => {},
        regenerateCard: () => {},
        disconnect: () => {},
        createRacetimeRoom: () => {},
        updateRacetimeRoom: () => {},
        joinRacetimeRoom: () => {},
        racetimeReady: () => {},
        racetimeUnready: () => {},
        toggleGoalStar: () => {},
        revealCard: () => {},
        toggleGoalDetails: () => {},
        toggleCounters: () => {},
        changeAuth: () => {},
        spectator: false,
        monitor: false,
    };

    const { title, subtitle } =
        titles[Math.floor(Math.random() * titles.length)];

    return (
        <RoomContext.Provider value={mockRoomContext}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                        p: 5,
                    }}
                >
                    <NextLink href="/">
                        <Image src={logo} alt="PlayBingo logo" height={125} />
                    </NextLink>
                    <Typography
                        variant="h4"
                        sx={{
                            pt: 1,
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            pb: 2,
                        }}
                    >
                        {subtitle}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            pb: 2,
                        }}
                    >
                        We couldn&#39;t find the page you are looking for. Take
                        this bingo with you for the journey home!
                    </Typography>
                    <Box
                        sx={{
                            width: '400px',
                            margin: '0 auto',
                        }}
                    >
                        <NextLink href="/" passHref>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    color: '#fff',
                                }}
                            >
                                <Board />
                            </Box>
                        </NextLink>
                    </Box>
                    <Box
                        sx={{
                            pt: 2,
                        }}
                    >
                        <Link
                            href="/"
                            component={NextLink}
                            underline="none"
                            sx={{
                                color: '#fff',
                            }}
                        >
                            ← Return Home
                        </Link>
                    </Box>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />
                <Footer />
            </Box>
        </RoomContext.Provider>
    );
}
