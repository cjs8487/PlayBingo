import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingLogs() {
    return (
        <Box
            role="status"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                minHeight: 380,
            }}
        >
            <CircularProgress size={24} />
            <Typography color="text.secondary">Loading server logs…</Typography>
        </Box>
    );
}
