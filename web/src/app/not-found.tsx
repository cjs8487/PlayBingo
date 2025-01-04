import { Box, Card, CardContent, Link, Typography } from '@mui/material';
import Image from 'next/image';
import logo from '../../public/logo.png';
import Footer from '../components/footer/Footer';
import NextLink from 'next/link';

export default function NotFound() {
    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <Box textAlign="center" p={5}>
                <NextLink href="/">
                    <Image src={logo} alt="PlayBingo logo" height={100} />
                </NextLink>
                <Typography variant="h4" pb={2}>
                    Not Found
                </Typography>
                <Typography>
                    The page you&#39;re looking for couldn&#39;t be found
                </Typography>
                <Box pt={0.5}>
                    <Link href="/" component={NextLink}>
                        ← Return home
                    </Link>
                </Box>
            </Box>
            <Box flexGrow={1} />
            <Footer />
        </Box>
    );
}
