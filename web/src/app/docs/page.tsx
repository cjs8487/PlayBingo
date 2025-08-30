import { Box } from '@mui/material';

export default function Docs() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'white',
            }}
        >
            <iframe src="doc.html" width="100%" height="100%" />
        </Box>
    );
}
