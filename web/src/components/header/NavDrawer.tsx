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
    Toolbar,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { icons } from '../footer/Footer';

export const drawerWidth = 240;

interface Props {
    open: boolean;
}

export default function NavDrawer({ open }: Props) {
    const segment = useSelectedLayoutSegment();
    return (
        <Drawer
            variant="persistent"
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Toolbar />
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
                    <ListItem disablePadding>
                        <ListItemButton
                            component={NextLink}
                            href="/games"
                            selected={segment === 'games'}
                        >
                            <ListItemIcon>
                                <Games />
                            </ListItemIcon>
                            <ListItemText>Games</ListItemText>
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={NextLink}
                            href="/rooms"
                            selected={segment === 'rooms'}
                        >
                            <ListItemIcon>
                                <PlayArrow />
                            </ListItemIcon>
                            <ListItemText>Rooms</ListItemText>
                        </ListItemButton>
                    </ListItem>
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={NextLink}
                            href="/docs"
                            selected={segment === 'docs'}
                        >
                            <ListItemIcon>
                                <MenuBook />
                            </ListItemIcon>
                            <ListItemText>Documentation</ListItemText>
                        </ListItemButton>
                    </ListItem>
                </List>
                <Divider />
                <List>
                    {icons.map((social) => (
                        <ListItem disablePadding key={social.icon.iconName}>
                            <ListItemButton
                                component={NextLink}
                                href={social.url}
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
