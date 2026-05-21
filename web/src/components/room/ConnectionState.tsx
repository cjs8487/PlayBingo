import { Paper, Typography, Box } from '@mui/material';
import { useContext } from 'react';
import { ConnectionStatus, RoomContext } from '../../context/RoomContext';

function getStatusContents(status: ConnectionStatus) {
    switch (status) {
        case ConnectionStatus.UNINITIALIZED:
            return {
                color: '',
                text: 'Uninitialized',
            };
        case ConnectionStatus.CONNECTING:
            return {
                color: 'success.light',
                text: 'Connecting',
            };
        case ConnectionStatus.CONNECTED:
            return {
                color: 'success.dark',
                text: 'Connected',
            };
        case ConnectionStatus.UNAUTHORIZED:
            return {
                color: 'error.dark',
                text: 'Unauthorized',
            };
        case ConnectionStatus.CLOSING:
            return {
                color: 'warning.main',
                text: 'Disconnecting',
            };
        case ConnectionStatus.CLOSED:
            return {
                color: '#c3c3c3',
                text: 'Disconnected',
            };
        default:
            return {
                color: '',
                text: 'Unknown connection status',
            };
    }
}

interface Props {
    collapsed?: boolean;
}

export default function ConnectionState({ collapsed }: Props) {
    const { connectionStatus, roomData } = useContext(RoomContext);

    const contents = getStatusContents(connectionStatus);

    return (
        <Paper
            elevation={3}
            sx={{
                py: 0.5,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                columnGap: 1,
            }}
        >
            <Box
                sx={{
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    backgroundColor: contents.color,
                }}
            />
            <Typography>
                {collapsed ? roomData?.name : contents.text}
            </Typography>
        </Paper>
    );
}
