import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Typography,
} from '@mui/material';
import { Suspense } from 'react';
import ActiveRoomList from '../../components/ActiveRoomList';
import ToasterOven from '../../components/utilities/ToasterOven';
import HomePageRoomForm from './_components/HomePageRoomForm';

export default async function Home() {
    return (
        <Box sx={{ p: 2 }}>
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    mb: 2,
                    '&::before': {
                        content: "''",
                        display: 'block',
                        background:
                            'linear-gradient(90deg,rgba(255, 255, 255, 0) 0%,rgba(102, 102, 102, 0.75) 50%,rgba(255, 255, 255, 0) 100%)',
                        height: '200%',
                        width: '150px',
                        position: 'absolute',
                        animation: 'rotate 12s linear forwards infinite',
                        zIndex: 0,
                        translate: '-50% -50%',
                        top: '50%',
                        left: '50%',
                    },
                    '@keyframes rotate': {
                        '0%': {
                            rotate: '0deg',
                        },
                        '50%': {
                            rotate: '180deg',
                        },
                        '100%': {
                            rotate: '360deg',
                        },
                    },
                }}
            >
                <Card
                    sx={{
                        textAlign: 'center',
                        px: 2,
                        pt: 2,
                        m: '2px',
                        position: 'relative',
                        zIndex: 1,
                        width: 'calc(100% - 4px)',
                        boxSizing: 'border-box',
                    }}
                >
                    <CardContent>
                        <HomePageRoomForm />
                    </CardContent>
                </Card>
            </Box>
            <Card
                sx={{
                    textAlign: 'center',
                    px: 2,
                    pt: 2,
                    width: '100%',
                }}
                elevation={2}
            >
                <Typography variant="h4">Join an Existing Room</Typography>
                <Suspense fallback={<CircularProgress />}>
                    <ActiveRoomList />
                </Suspense>
            </Card>
            <ToasterOven />
        </Box>
    );
}
