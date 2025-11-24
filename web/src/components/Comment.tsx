import { Avatar, Box, Chip, Typography } from '@mui/material';
import type { Comment } from '@playbingo/types';

interface Props {
    comment: Comment;
}

export default function Comment({ comment }: Props) {
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
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    sx={{ width: 32, height: 32 }}
                />
                <Typography>{comment.user.username}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip label="Owner" variant="outlined" />
            </Box>
            <Box sx={{ px: 1.5, pb: 1 }}>
                <Typography>{comment.comment}</Typography>
            </Box>
        </Box>
    );
}
