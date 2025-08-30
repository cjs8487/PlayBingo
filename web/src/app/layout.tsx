import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';
import { UserContextProvider } from '../context/UserContext';
import theme from '../theme';
import './globals.css';

export const metadata: Metadata = {
    title: { template: '%s | PlayBingo', default: 'PlayBingo' },
    description: 'The next generation of gaming bingo',
    openGraph: {
        title: {
            template: '%s | PlayBingo',
            default: 'PlayBingo',
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
            <body>
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
