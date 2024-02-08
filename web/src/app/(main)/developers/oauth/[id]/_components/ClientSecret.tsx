'use client';
import { Box, Button, Typography } from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { useState } from 'react';
import CopyButton from './CopyButton';

interface Props {
    application: OAuthClient;
}

export default function ClientSecret({ application }: Props) {
    const [secret, setSecret] = useState('');

    return (
        <>
            {secret && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography>{secret}</Typography>
                    <CopyButton value={secret} />
                </Box>
            )}
            {!secret && (
                <Button
                    onClick={async () => {
                        const res = await fetch(
                            `/api/oauth/${application.id}/resetSecret`,
                            {
                                method: 'POST',
                            },
                        );
                        if (!res.ok) {
                            //TODO: handle error
                            return;
                        }
                        // display the secret
                        const secret = (await res.json()).clientSecret;
                        setSecret(secret);
                    }}
                >
                    Reset
                </Button>
            )}
        </>
    );
}
