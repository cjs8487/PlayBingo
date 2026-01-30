'use client';
import {
    Logout as IconLogout,
    MenuBook as MenuBookIcon,
    Menu as MenuIcon,
    Person,
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import logo from '../../images/playbingologo.png';
import { userAvatarUrl } from '../../lib/Utils';
import LinkButton from '../LinkButton';
import NavDrawer from './NavDrawer';

export const pages = [
    { name: 'Games', path: '/games' },
    { name: 'Play', path: '/rooms' },
    { name: 'Discord', path: 'https://discord.gg/8sKNBaq8gu' },
];

export default function Header() {
    const { user, logout } = useContext(UserContext);

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        logout();
        handleCloseUserMenu();
    };

    return (
        <>
            <AppBar
                position="sticky"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={() => setDrawerOpen((curr) => !curr)}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <LinkButton href="/">
                            <Image
                                src={logo}
                                alt="PlayBingo logo"
                                height={52}
                            />
                        </LinkButton>
                    </Box>
                    {user ? (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open user menu">
                                <Button
                                    style={{ color: 'white' }}
                                    onClick={handleOpenUserMenu}
                                    sx={{
                                        display: 'flex',
                                        columnGap: 1,
                                    }}
                                >
                                    {user.username}
                                    <Avatar
                                        src={
                                            user.avatar
                                                ? userAvatarUrl(user.avatar)
                                                : undefined
                                        }
                                        alt={user.username}
                                    />
                                </Button>
                            </Tooltip>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem component={NextLink} href="/profile">
                                    <ListItemIcon>
                                        <Person />
                                    </ListItemIcon>
                                    <ListItemText>Profile</ListItemText>
                                </MenuItem>
                                {user.staff && (
                                    <MenuItem
                                        component={NextLink}
                                        href="/staff"
                                    >
                                        <ListItemIcon>
                                            <Person />
                                        </ListItemIcon>
                                        <ListItemText>
                                            Staff Dashboard
                                        </ListItemText>
                                    </MenuItem>
                                )}
                                <Divider />
                                <MenuItem component={NextLink} href="/docs">
                                    <ListItemIcon>
                                        <MenuBookIcon />
                                    </ListItemIcon>
                                    <ListItemText>Documentation</ListItemText>
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <IconLogout fontSize="small" />
                                    </ListItemIcon>
                                    <Typography
                                        sx={{
                                            textAlign: 'center',
                                        }}
                                    >
                                        Logout
                                    </Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <LinkButton href="/login">Login</LinkButton>
                    )}
                </Toolbar>
            </AppBar>
            <NavDrawer open={drawerOpen} />
        </>
    );
}
