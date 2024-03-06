'use client';
import { CheckCircle } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react';
import { useUserContext } from '../../../context/UserContext';
import NextLink from 'next/link';
import LinkIcon from '@mui/icons-material/Link';
import { alertError } from '../../../lib/Utils';

const readableScopes: {
    [key: string]: string;
} = {
    'rooms:join': 'Create and join rooms on your behalf',
    'rooms:act': 'Take actions in rooms on your behalf',
    'categories:moderate':
        'Take moderation actions on categories you have permissions',
    'profile:read': 'Access your account information',
    'profile:write': 'Update your account information',
};

interface Props {
    client: OAuthClient;
    scopes: string[];
    redirectUri: string;
    transactionId: string;
}

export default function Authorize({
    client,
    scopes,
    redirectUri,
    transactionId,
}: Props) {
    const { user, current } = useUserContext();
    const router = useRouter();

    useLayoutEffect(() => {
        if (current && !user) {
            router.push('/login');
        }
    }, [user, current, router]);

    if (!user) {
        return null;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: (theme) =>
                    `repeating-conic-gradient(${theme.palette.background.default} 0% 25%, ${theme.palette.secondary.main} 0% 50%) 50% / 500px 500px`,
            }}
        >
            <Card
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    opacity: 0.9,
                    textAlign: 'center',
                    maxWidth: 500,
                }}
                className="shadow-md"
            >
                <CardContent>
                    <Box sx={{ pb: 3 }}>
                        <Typography variant="h4">
                            Hi there, {user.username}.
                        </Typography>
                        <Typography variant="body1">
                            <Link
                                component={NextLink}
                                href={'login?force=true'}
                            >
                                Not you?
                            </Link>
                        </Typography>
                    </Box>
                    <Box>
                        <Typography>An external application</Typography>
                        <Typography
                            variant="body1"
                            className="text-xl font-semibold"
                        >
                            {client.name}
                        </Typography>
                        <Typography>
                            wants to access your PlayBingo account.
                        </Typography>
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    <Box
                        sx={{
                            width: '100%',
                            px: 4,
                            textAlign: 'left',
                        }}
                    >
                        <Typography>
                            This will allow the application to
                        </Typography>
                        <List>
                            {scopes.map((scope) => (
                                <ListItem
                                    key={scope}
                                    sx={{ m: 0, px: 0, py: 0.5, gap: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 0 }}>
                                        <CheckCircle />
                                    </ListItemIcon>
                                    <ListItemText>
                                        {readableScopes[scope]}
                                    </ListItemText>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    <Typography
                        variant="caption"
                        sx={{ textAlign: 'left', alignSelf: 'flex-start' }}
                    >
                        You should only authorize this application if you
                        recognize it. If you don&#39;t recognize it, you can
                        safely close this window.
                    </Typography>
                    <Box sx={{ textAlign: 'left' }}>
                        <LinkIcon />
                        <Typography variant="caption">
                            Once authorized, you will be redirected outside of
                            bingo.gg to {redirectUri}
                        </Typography>
                    </Box>
                </CardContent>
                <CardActions>
                    <Box sx={{ width: '100%', py: 1 }}>
                        <Button
                            onClick={async () => {
                                const res = await fetch(
                                    '/api/oauth/authorize',
                                    {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            transaction_id: transactionId,
                                        }),
                                        redirect: 'follow',
                                    },
                                );
                                if (res.redirected) {
                                    console.log('redirecting');
                                    console.log(res);
                                    router.push(res.url);
                                }
                                if (!res.ok) {
                                    console.log('error');
                                    const error = await res.text();
                                    alertError(
                                        `Unable to grant OAuth permissions - ${error}`,
                                    );
                                    return;
                                }
                            }}
                        >
                            Authorize
                        </Button>
                    </Box>
                </CardActions>
            </Card>
        </Box>
    );
}
