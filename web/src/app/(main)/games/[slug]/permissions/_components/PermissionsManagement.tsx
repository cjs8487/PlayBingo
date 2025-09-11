'use client';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import { useCallback, useState } from 'react';
import { mutate } from 'swr';
import { alertError } from '@/lib/Utils';
import UserSearch from '@/components/UserSearch';

interface PermissionsManagementProps {
    gameData: Game;
}

export default function PermissionsManagement({
    gameData: { slug, owners, moderators },
}: PermissionsManagementProps) {
    const [searchOpenOwner, setSearchOpenOwner] = useState(false);
    const [searchOpenMod, setSearchOpenMod] = useState(false);

    const updateData = useCallback(() => {
        mutate(`/api/games/${slug}`);
        mutate(`/api/games/${slug}/eligibleMods`);
    }, [slug]);

    return (
        <Box>
            <Box
                sx={{
                    pb: 3,
                }}
            >
                <Typography variant="h6">Owners</Typography>
                <Typography
                    variant="caption"
                    sx={{
                        pb: 3,
                    }}
                >
                    Owners have full moderation powers over a game, including
                    appointing additional owners and moderators.
                </Typography>
                <Box>
                    {owners?.map((owner) => (
                        <Box
                            key={owner.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body1">
                                {owner.username}
                            </Typography>
                            {owners?.length && owners.length > 1 && (
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        const res = await fetch(
                                            `/api/games/${slug}/owners`,
                                            {
                                                method: 'DELETE',
                                                headers: {
                                                    'Content-Type':
                                                        'application/json',
                                                },
                                                body: JSON.stringify({
                                                    user: owner.id,
                                                }),
                                            },
                                        );
                                        if (!res.ok) {
                                            const error = await res.text();
                                            alertError(
                                                `Unable to remove owner - ${error}`,
                                            );
                                            return;
                                        }
                                        updateData();
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Box>
                <Button
                    onClick={() => setSearchOpenOwner(true)}
                    startIcon={<AddIcon />}
                >
                    Add new owner
                </Button>
                <UserSearch
                    isOpen={searchOpenOwner}
                    close={() => setSearchOpenOwner(false)}
                    submit={async (selectedUsers) => {
                        const res = await fetch(`/api/games/${slug}/owners`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ users: selectedUsers }),
                        });
                        if (!res.ok) {
                            const error = await res.text();
                            alertError(`Unable to add new owners - ${error}`);
                            return;
                        }
                        updateData();
                    }}
                    listPath={`/api/games/${slug}/eligibleMods`}
                />
            </Box>
            <Box>
                <Typography variant="h5">Moderators</Typography>
                <Typography
                    variant="caption"
                    sx={{
                        pb: 3,
                    }}
                >
                    Moderators have the power to modify goal lists and create
                    game modes and variants, as well as modify some game
                    settings.
                </Typography>
                <div>
                    {moderators?.map((mod) => (
                        <Box
                            key={mod.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body1">
                                {mod.username}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={async () => {
                                    const res = await fetch(
                                        `/api/games/${slug}/moderators`,
                                        {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: JSON.stringify({
                                                user: mod.id,
                                            }),
                                        },
                                    );
                                    if (!res.ok) {
                                        const error = await res.text();
                                        alertError(
                                            `Unable to remove moderator - ${error}`,
                                        );
                                        return;
                                    }
                                    updateData();
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}
                </div>
                <Button
                    onClick={() => setSearchOpenMod(true)}
                    startIcon={<AddIcon />}
                >
                    Add new moderator
                </Button>
                <UserSearch
                    isOpen={searchOpenMod}
                    close={() => setSearchOpenMod(false)}
                    submit={async (selectedUsers) => {
                        const res = await fetch(
                            `/api/games/${slug}/moderators`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ users: selectedUsers }),
                            },
                        );
                        if (!res.ok) {
                            const error = await res.text();
                            alertError(
                                `Unable to add new moderators - ${error}`,
                            );
                            return;
                        }
                        updateData();
                    }}
                    listPath={`/api/games/${slug}/eligibleMods`}
                />
            </Box>
        </Box>
    );
}
