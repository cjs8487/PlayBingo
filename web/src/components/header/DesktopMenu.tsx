import { Box, Button, Typography } from '@mui/material';
import { pages } from './Header';
import LinkButton from '../LinkButton';
import Image from 'next/image';
import logo from '../../images/playbingologo.png';

export default function DesktopMenu() {
    return (
        <>
            <LinkButton href="/">
                <Image src={logo} alt="PlayBingo logo" height={52} />
            </LinkButton>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{
                display: "flex"
            }}>
                {pages.map((page) => (
                    <LinkButton key={page.name} href={page.path}>
                        {page.name}
                    </LinkButton>
                ))}
            </Box>
        </>
    );
}
