import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Games, PlayArrow, MenuBook } from '@mui/icons-material';
import {
    Box,
    Drawer,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
} from '@mui/material';
import { icons } from '../footer/Footer';
import NextLink from 'next/link';

interface Props {
    open: boolean;
}

export default function NavDrawer({ open }: Props) {
    return (
        <Drawer variant="persistent" open={open}>
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
                        <ListItemButton component={NextLink} href="/games">
                            <ListItemIcon>
                                <Games />
                            </ListItemIcon>
                            <ListItemText>Games</ListItemText>
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton component={NextLink} href="/rooms">
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
                        <ListItemButton>
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
