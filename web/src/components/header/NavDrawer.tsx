'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Games, MenuBook, PlayArrow } from '@mui/icons-material';
import {
    Box,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import logo from '../../images/playbingologo.png';
import { icons } from '../footer/Footer';

export const drawerWidth = 240;

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface NavLinkProps {
    href: string;
    icon: ReactNode;
    children: ReactNode;
    onClick: () => void;
    selected?: boolean;
}

function NavLink({ href, icon, children, onClick, selected }: NavLinkProps) {
    return (
        <ListItemButton
            component={NextLink}
            href={href}
            selected={selected}
            onClick={onClick}
        >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText>{children}</ListItemText>
        </ListItemButton>
    );
}

function ActiveNavLink(props: NavLinkProps) {
    const segment = useSelectedLayoutSegment();
    return <NavLink {...props} selected={`/${segment}` === props.href} />;
}

function DrawerNavLink(props: NavLinkProps) {
    return (
        <Suspense fallback={<NavLink {...props} />}>
            <ActiveNavLink {...props} />
        </Suspense>
    );
}

export default function NavDrawer({ open, setOpen }: Props) {
    return (
        <Drawer
            open={open}
            onClose={() => setOpen(false)}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Box
                sx={{
                    overflow: 'auto',
                    maxHeight: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <List>
                    <ListItem>
                        <Image src={logo} alt="PlayBingo logo" height={52} />
                    </ListItem>
                    <ListItem disablePadding>
                        <DrawerNavLink
                            href="/games"
                            icon={<Games />}
                            onClick={() => setOpen(false)}
                        >
                            Games
                        </DrawerNavLink>
                    </ListItem>
                    <ListItem disablePadding>
                        <DrawerNavLink
                            href="/rooms"
                            icon={<PlayArrow />}
                            onClick={() => setOpen(false)}
                        >
                            Rooms
                        </DrawerNavLink>
                    </ListItem>
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <List>
                    <ListItem disablePadding>
                        <DrawerNavLink
                            href="/docs"
                            icon={<MenuBook />}
                            onClick={() => setOpen(false)}
                        >
                            Documentation
                        </DrawerNavLink>
                    </ListItem>
                </List>
                <Divider />
                <List>
                    {icons.map((social) => (
                        <ListItem disablePadding key={social.icon.iconName}>
                            <ListItemButton
                                component={NextLink}
                                href={social.url}
                                onClick={() => setOpen(false)}
                            >
                                <ListItemIcon>
                                    <FontAwesomeIcon icon={social.icon} />
                                </ListItemIcon>
                                <ListItemText>{social.name}</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Typography
                variant="body2"
                sx={{ px: 2, pb: 1, textAlign: 'right' }}
            >
                v{process.env.version}
            </Typography>
        </Drawer>
    );
}
