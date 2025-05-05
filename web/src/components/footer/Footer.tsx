import {
    IconDefinition,
    faDiscord,
    faGithub,
    faPatreon,
    faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Box,
    IconButton,
    Link,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const icons: { icon: IconDefinition; url: string }[] = [
    { icon: faGithub, url: 'https://github.com/cjs8487/PlayBingo' },
    { icon: faPatreon, url: 'https://www.patreon.com/Bingothon' },
    { icon: faTwitter, url: 'https://twitter.com/bingothon' },
    { icon: faDiscord, url: 'https://discord.gg/8sKNBaq8gu' },
];

function LargeFooter() {
    return (
        <Box
            sx={{
                alignItems: 'end',
                px: 2,
                pt: 2,
                pb: 0.5,
                display: { xs: 'none', md: 'block' },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: 1,
                    mb: 0,
                    width: '100%',
                }}
            >
                {icons.map(({ icon, url }) => (
                    <IconButton
                        key={icon.iconName}
                        href={url}
                        LinkComponent={NextLink}
                        size="small"
                    >
                        <FontAwesomeIcon icon={icon} />
                    </IconButton>
                ))}
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />
                <Tooltip title="Documentation">
                    <IconButton
                        size="small"
                        LinkComponent={NextLink}
                        href="/docs"
                    >
                        <MenuBookIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box
                sx={{
                    alignItems: 'end',
                    display: 'flex',
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <Typography variant="caption">
                        © Copyright 2024 - {new Date().getFullYear()} Bingothon
                        | All Rights Reserved |{' '}
                        <Link href="/legal/privacy" component={NextLink}>
                            Privacy Policy
                        </Link>
                    </Typography>
                </Box>
                <Typography variant="caption">
                    PlayBingo v{process.env.version}
                </Typography>
            </Box>
        </Box>
    );
}

function SmallFooter() {
    return (
        <Box
            sx={{
                alignItems: 'end',
                px: 2,
                pt: 2,
                pb: 0.5,
                display: { md: 'none' },
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        columnGap: 1,
                        mb: 0,
                    }}
                >
                    {icons.map(({ icon, url }) => (
                        <IconButton
                            key={icon.iconName}
                            href={url}
                            LinkComponent={NextLink}
                            size="small"
                        >
                            <FontAwesomeIcon icon={icon} size="sm" />
                        </IconButton>
                    ))}
                </Box>
                <Typography variant="caption">
                    © Copyright 2024 - {new Date().getFullYear()} Bingothon |
                    All Rights Reserved
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <Link
                        href="/legal/privacy"
                        component={NextLink}
                        variant="caption"
                    >
                        Privacy Policy
                    </Link>
                </Box>
                <Typography variant="caption">
                    PlayBingo v{process.env.version}
                </Typography>
            </Box>
        </Box>
    );
}

export default function Footer() {
    return (
        <Paper component="footer">
            <SmallFooter />
            <LargeFooter />
        </Paper>
    );
}
