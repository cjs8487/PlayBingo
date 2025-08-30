import { Box } from '@mui/material';
import Image from 'next/image';
import logo from '../../images/playbingologo.png';
import LinkButton from '../LinkButton';
import { pages } from './Header';

export default function DesktopMenu() {
    return (
        <>
            <LinkButton href="/">
                <Image src={logo} alt="PlayBingo logo" height={52} />
            </LinkButton>
            <Box sx={{ flexGrow: 1 }} />
            <Box
                sx={{
                    display: 'flex',
                }}
            >
                {pages.map((page) => (
                    <LinkButton key={page.name} href={page.path}>
                        {page.name}
                    </LinkButton>
                ))}
            </Box>
        </>
    );
}
