'use client';

import { Box, Button } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Game } from '@playbingo/types';
import NextLink from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { alertError } from '../../../../../lib/Utils';

interface Props {
    gameData: Game;
}

export default function GameTabs({
    gameData: {
        slug,
        newGeneratorBeta,
        descriptionMd,
        setupMd,
        difficultyVariants,
        difficultyVariantsEnabled,
    },
}: Props) {
    const [isOwner, setIsOwner] = useState(false);
    const [canModerate, setCanModerate] = useState(false);

    const segment = useSelectedLayoutSegment();

    useLayoutEffect(() => {
        async function loadPermissions() {
            const res = await fetch(`/api/games/${slug}/permissions`);
            if (!res.ok) {
                if (res.status !== 401 && res.status !== 403) {
                    alertError('Unable to determine game permissions.');
                }
                return;
            }
            const permissions = await res.json();
            setIsOwner(permissions.isOwner);
            setCanModerate(permissions.canModerate);
        }
        loadPermissions();
    }, [slug]);

    const tabs: string[] = [];
    if (descriptionMd || setupMd || (difficultyVariants?.length ?? 0) > 0) {
        tabs.push('overview');
    }
    tabs.push('goals');
    if (canModerate) {
        tabs.push('categories');
    }
    if (isOwner) {
        if (difficultyVariantsEnabled) {
            tabs.push('Variants');
        }
        tabs.push('permissions');
        if (newGeneratorBeta) {
            tabs.push('generation');
        }
        tabs.push('settings');
    }

    return (
        <Box
            sx={{
                display: 'flex',
                maxWidth: '100%',
                overflowX: 'auto',
                pt: 4,
                scrollbarWidth: 0,
                '::-webkit-scrollbar': {
                    display: 'none',
                },
            }}
        >
            <Box sx={{ width: 32, borderBottom: 2, borderColor: 'divider' }} />
            {tabs.map((page, index) => (
                <Button
                    key={page}
                    component={NextLink}
                    href={`/games/${slug}/${page}`}
                    sx={{
                        p: 2,
                        borderRadius: 0,
                        border: 1,
                        borderLeft: 1,
                        borderBottom: 2,
                        borderTop: page === segment ? 4 : 2,
                        borderColor: 'divider',
                        borderTopColor: page === segment ? 'white' : 'divider',
                        borderBottomColor:
                            page === segment ? grey[900] : 'divider',
                        background: page === segment ? grey[900] : 'inherit',
                        marginLeft: index > 0 ? '-1px' : 0,
                        minWidth: 'fit-content',
                        ':hover': {
                            backgroundColor:
                                page !== segment
                                    ? 'rgba(182, 105, 250, 0.08)'
                                    : grey[900],
                        },
                    }}
                >
                    {page}
                </Button>
            ))}
            <Box
                sx={{ flexGrow: 1, borderBottom: 2, borderColor: 'divider' }}
            />
        </Box>
    );
}
