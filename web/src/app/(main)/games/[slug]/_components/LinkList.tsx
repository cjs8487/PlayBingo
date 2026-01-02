'use client';

import { CopyAll } from '@mui/icons-material';
import { Typography, Button, Link, IconButton, Box } from '@mui/material';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useCopyToClipboard } from 'react-use';
import { alertError } from '../../../../../lib/Utils';

interface Props {
    linksMarkdown: string;
}

export default function LinkList({ linksMarkdown }: Props) {
    const [state, copyToClipboard] = useCopyToClipboard();

    useEffect(() => {
        if (state.error) {
            alertError(
                `Unable to copy link to clipboard - ${state.error.message}`,
            );
        }
    }, [state]);

    return (
        <ReactMarkdown
            components={{
                p({ children, ...props }) {
                    return (
                        <Typography
                            {...props}
                            sx={{
                                mb: 1,
                            }}
                        >
                            {children}
                        </Typography>
                    );
                },
                a({ children, ...props }) {
                    const { href, key } = props;
                    return (
                        <Button
                            key={key}
                            component={Link}
                            href={href ?? ''}
                            sx={{
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
                                {children}
                            </Box>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    copyToClipboard(href ?? '');
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <CopyAll />
                            </IconButton>
                        </Button>
                    );
                },
            }}
        >
            {linksMarkdown}
        </ReactMarkdown>
    );
}
