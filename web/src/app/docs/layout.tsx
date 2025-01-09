import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Footer from '../../components/footer/Footer';
import LinkButton from '../../components/LinkButton';
import DocUserMenu from './DocUserMenu';
import Image from 'next/image';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Box display="flex" flexDirection="column" height="100vh">
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
                        <Typography variant="h6" ml={1}>
                            Docs
                        </Typography>
                    </LinkButton>
                    <Box flexGrow={1} />
                    <Box display="flex">
                        <LinkButton href="/docs">API Docs</LinkButton>
                        <LinkButton href="/docs">Websocket</LinkButton>
                    </Box>
                    <DocUserMenu />
                </Toolbar>
            </AppBar>
            <Box flexGrow={1}>{children}</Box>
            <Footer />
        </Box>
    );
}
