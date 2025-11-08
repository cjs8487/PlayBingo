import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import Image from 'next/image';
import LinkButton from '../../../components/LinkButton';
import DocUserMenu from '../DocUserMenu';

export default function () {
    return (
        <AppBar position="sticky">
            <Toolbar>
                <LinkButton href="/">
                    <Image
                        src="/logo.png"
                        alt="PlayBingo logo"
                        width={5900}
                        height={1867}
                        style={{ width: 'auto', height: '52px' }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            ml: 1,
                        }}
                    >
                        Docs
                    </Typography>
                </LinkButton>
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />
                <Box
                    sx={{
                        display: 'flex',
                    }}
                >
                    <LinkButton href="/docs">API Docs</LinkButton>
                    <LinkButton href="/docs/websocket">Websocket</LinkButton>
                </Box>
                <DocUserMenu />
            </Toolbar>
        </AppBar>
    );
}
