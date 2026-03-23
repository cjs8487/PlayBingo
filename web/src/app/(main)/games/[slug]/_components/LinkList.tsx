'use client';

import { CopyAll } from '@mui/icons-material';
import { Box, Button, IconButton, Link, Tooltip } from '@mui/material';
import { GameResource } from '@playbingo/types';
import { useEffect } from 'react';
import { useCopyToClipboard } from 'react-use';
import { alertError } from '../../../../../lib/Utils';

interface Props {
    links: GameResource[];
}

export default function LinkList({ links }: Props) {
    const [state, copyToClipboard] = useCopyToClipboard();

    useEffect(() => {
        if (state.error) {
            alertError(
                `Unable to copy link to clipboard - ${state.error.message}`,
            );
        }
    }, [state]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '150px',
                overflowY: 'auto',
            }}
        >
            {links.map(({ id, name, url, description }) => (
                <Tooltip key={id} title={description} arrow>
                    <Button
                        component={Link}
                        href={url}
                        sx={{
                            py: 0.5,
                            width: '100%',
                            '.MuiIconButton-root': {
                                visibility: 'hidden',
                            },
                            '&:hover .MuiIconButton-root': {
                                visibility: 'inherit',
                            },
                        }}
                    >
                        <Box component="span" sx={{ flexGrow: 1 }}>
                            {name}
                        </Box>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                copyToClipboard(url);
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        >
                            <CopyAll />
                        </IconButton>
                    </Button>
                </Tooltip>
            ))}
        </Box>
    );
}
