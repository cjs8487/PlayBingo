import { Box, Paper } from '@mui/material';
import RoomLogin from '../RoomLogin';

export default function RoomLoginPage() {
    return (
        <Box
            display="flex"
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
        >
            <Paper
                sx={{
                    p: 4,
                }}
            >
                <RoomLogin />
            </Paper>
        </Box>
    );
}
