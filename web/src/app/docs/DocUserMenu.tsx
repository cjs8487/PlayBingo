'use client';
import IconLogout from '@mui/icons-material/Logout';
import Person from '@mui/icons-material/Person';
import {
    Avatar,
    Box,
    Button,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useContext, useState } from 'react';
import LinkButton from '../../components/LinkButton';
import { UserContext } from '../../context/UserContext';

export default function DocUserMenu() {
    const { user, loggedIn, logout } = useContext(UserContext);

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
    if (!user) {
        return <LinkButton href="/login">Login</LinkButton>;
    }
    return (
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
                    <Avatar alt={user.username} />
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
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <IconLogout fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Logout</Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
}
