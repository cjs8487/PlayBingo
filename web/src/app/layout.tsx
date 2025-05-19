import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserContextProvider } from '../context/UserContext';
import theme from '../theme';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: { template: '%s | PlayBingo', default: 'PlayBingo' },
    description: 'The next generation of gaming bingo',
    openGraph: {
        title: {
            template: '%s | PlayBingo',
            default: 'PlayBingo',
        },
        images: {
            url: 'https://playbingo.gg/logo.png',
            width: 5900,
            height: 1867,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{}}>
                <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <UserContextProvider>{children}</UserContextProvider>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
