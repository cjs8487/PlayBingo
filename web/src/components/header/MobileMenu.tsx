import MenuIcon from '@mui/icons-material/Menu';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';
import { pages } from './Header';
import Link from 'next/link';
import logo from '../../images/playbingologo.png';
import LinkButton from '../LinkButton';
import Image from 'next/image';

export default function MobileMenu() {
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };
    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    justifyItems: 'center',
                }}
            >
                <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleOpenNavMenu}
                    color="inherit"
                >
                    <MenuIcon />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorElNav}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    open={Boolean(anchorElNav)}
                    onClose={handleCloseNavMenu}
                >
                    {pages.map((page) => (
                        <MenuItem key={page.name} onClick={handleCloseNavMenu}>
                            <Link href={page.path}>
                                <Typography
                                    sx={{
                                        textAlign: 'center',
                                    }}
                                >
                                    {page.name}
                                </Typography>
                            </Link>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
            <LinkButton href="/">
                <Image src={logo} alt="PlayBingo logo" height={52} />
            </LinkButton>
            <Box
                sx={{
                    flexGrow: 1,
                }}
            />
        </>
    );
}
