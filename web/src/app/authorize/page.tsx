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
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useLayoutEffect } from 'react';
import { UserContext } from '../../context/UserContext';

const readableScopes = {};

export default function Authorize() {
    const { user, current } = useContext(UserContext);
    const router = useRouter();

    useLayoutEffect(() => {
        if (current && !user) {
            router.push('/login');
        }
    }, [user, current, router]);
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId');
    const scopes = searchParams.get('scopes');

    console.log(user);

    if (!user) {
        return null;
    }

    if (!clientId) {
        return 'missing client id';
    }
    if (typeof clientId !== 'string') {
        return 'invalid client id';
    }
    if (!scopes) {
        return 'no scopes specified';
    }
    if (typeof scopes !== 'string') {
        return 'invalid scope list';
    }

    const scopeList = scopes.split(' ');

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
                            {clientId}
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
                            {scopeList.map((scope) => (
                                <ListItem
                                    key={scope}
                                    sx={{ m: 0, px: 0, py: 0.5 }}
                                >
                                    <ListItemIcon>
                                        <CheckCircle />
                                    </ListItemIcon>
                                    <ListItemText>{scope}</ListItemText>
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
                </CardContent>
                <CardActions>
                    <Box sx={{ width: '100%', py: 1 }}>
                        <Button>Authorize</Button>
                    </Box>
                </CardActions>
            </Card>
        </Box>
    );
}
