'use client';
import { Code } from '@mui/icons-material';
import IconLogout from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Person from '@mui/icons-material/Person';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { userAvatarUrl } from '../../lib/Utils';
import LinkButton from '../LinkButton';
import DesktopMenu from './DesktopMenu';
import MobileMenu from './MobileMenu';

export const pages = [
    { name: 'Games', path: '/games' },
    { name: 'Play', path: '/rooms' },
    { name: 'Discord', path: 'https://discord.gg/8sKNBaq8gu' },
];

export default function Header() {
    const { user, logout } = useContext(UserContext);

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

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
        <AppBar position="sticky">
            <Toolbar>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
                    <DesktopMenu />
                </Box>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }}>
                    <MobileMenu />
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
                                <MenuItem component={NextLink} href="/staff">
                                    <ListItemIcon>
                                        <Person />
                                    </ListItemIcon>
                                    <ListItemText>Staff Dashboard</ListItemText>
                                </MenuItem>
                            )}
                            {user.developer && (
                                <MenuItem
                                    component={NextLink}
                                    href="/developers/oauth"
                                >
                                    <ListItemIcon>
                                        <Code />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Developer Portal
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
    );
}
