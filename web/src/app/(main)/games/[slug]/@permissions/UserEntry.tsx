'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, Typography } from '@mui/material';
import { User } from '../../../../../types/User';
import { alertError } from '../../../../../lib/Utils';
import { GamePermissionResponse } from '../../../../../actions/Game';

interface Props {
    slug: string;
    user: User;
    canRemove?: boolean;
    remove: (slug: string, userId: string) => Promise<GamePermissionResponse>;
}

export default function UserEntry({ slug, user, canRemove, remove }: Props) {
    return (
        <Box display="flex" alignItems="center" key={user.id}>
            <Typography variant="body1">{user.username}</Typography>
            {canRemove && (
                <IconButton
                    size="small"
                    onClick={async () => {
                        const res = await remove(slug, user.id);
                        if (!res.ok) {
                            alertError(`Unable to remove - ${res.error}`);
                        }
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}
        </Box>
    );
}
