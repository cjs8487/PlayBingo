import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Paper,
    Typography,
} from '@mui/material';
import { Suspense } from 'react';
import ActiveRoomList from '../../components/ActiveRoomList';
import ToasterOven from '../../components/utilities/ToasterOven';
import HomePageRoomForm from './_components/HomePageRoomForm';

export default async function Home() {
    return (
        <Container sx={{ py: 2 }}>
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
                        marginTop: '-50%',
                        left: '50%',
                        transformOrigin: 'center',
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
                        px: { xs: 2, sm: 6, md: 12 },
                        py: 4,
                        m: '2px',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <CardContent>
                        <HomePageRoomForm />
                    </CardContent>
                </Card>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 8,
                    rowGap: 1,
                    flexWrap: 'wrap',
                    width: '100%',
                    justifyContent: 'center',
                    px: 4,
                }}
            >
                <Paper
                    sx={{
                        textAlign: 'center',
                        px: { xs: 2, md: 12 },
                        py: 4,
                        mb: 4,
                        animation: '1.5s 1 slidein',
                        animationDelay: '1s',
                        animationFillMode: 'backwards',
                    }}
                    elevation={2}
                >
                    <Typography variant="h4">Join an Existing Room</Typography>
                    <Suspense fallback={<CircularProgress />}>
                        <ActiveRoomList />
                    </Suspense>
                </Paper>
            </Box>
            <ToasterOven />
        </Container>
    );
}
