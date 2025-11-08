'use client';
import { LinkProps } from '@mui/material/Link';
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { forwardRef } from 'react';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const LinkBehavior = forwardRef<HTMLAnchorElement, NextLinkProps>(
    function Link(props, ref) {
        const { href, ...other } = props;
        // Map href (Material UI) -> to (react-router)
        return <NextLink ref={ref} href={href} {...other} />;
    },
);

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#b769fa',
        },
        secondary: {
            main: '#600011',
        },
        info: {
            main: '#627fbe',
        },
        contrastThreshold: 4.5,
    },
    typography: {
        fontFamily: roboto.style.fontFamily,
        h1: {
            fontSize: '3.25rem',
        },
        h2: {
            fontSize: '2.5rem',
        },
        h3: {
            fontSize: '2rem',
        },
        h4: {
            fontSize: '1.75rem',
        },
    },
    components: {
        MuiAppBar: {
            defaultProps: {
                color: 'secondary',
                enableColorOnDark: true,
            },
        },
        MuiIcon: {
            defaultProps: {
                color: 'action',
            },
        },
        MuiDialog: {
            defaultProps: {
                transitionDuration: 500,
            },
        },
        MuiBadge: {
            defaultProps: {
                color: 'primary',
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    '& .hidden-controls': {
                        display: 'none',
                        position: 'absolute',
                    },
                    '&:hover .hidden-controls': {
                        display: 'flex',
                    },
                },
            },
        },
        MuiLink: {
            defaultProps: {
                component: LinkBehavior,
            } as LinkProps,
        },
        MuiButtonBase: {
            defaultProps: {
                LinkComponent: LinkBehavior,
            },
        },
    },
    shape: {
        borderRadius: 8,
    },
});

export default theme;
