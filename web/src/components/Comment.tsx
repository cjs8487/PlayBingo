import { Avatar, Box, Chip, Typography } from '@mui/material';

export default function Comment() {
    return (
        <Box
            sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    mb: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Avatar
                    src="avatar.png"
                    alt="cjs07"
                    sx={{ width: 32, height: 32 }}
                />
                <Typography>cjs07</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip label="Owner" variant="outlined" />
            </Box>
            <Box sx={{ px: 1.5, pb: 1 }}>
                <Typography>
                    lorem ipsum dolar sit amet comment text may be somewhat
                    relevant to the goal. If it is not relevant maybe it will
                    just ramble on and on and on. lorem ipsum dolar sit amet
                    comment text maybe somewhat relevant to the goal lorem ipsum
                    dolar sit amet comment text maybe somewhat relevant to the
                    goal lorem ipsum dolar sit amet comment text maybe somewhat
                    relevant to the goal lorem ipsum dolar sit amet comment text
                    maybe somewhat relevant to the goal lorem ipsum dolar sit
                    amet comment text maybe somewhat relevant to the goal lorem
                    ipsum dolar sit amet comment text maybe somewhat relevant to
                    the goal lorem ipsum dolar sit amet comment text maybe
                    somewhat relevant to the goal
                </Typography>
            </Box>
        </Box>
    );
}
