import {
    Card,
    CardActionArea,
    CardContent,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { RoomData } from '@playbingo/types';
import Link from 'next/link';
import { serverGet } from '../app/ServerUtils';
import { connection } from 'next/server';

async function getRooms(): Promise<RoomData[]> {
    const res = await serverGet('/api/rooms');
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function ActiveRoomList() {
    await connection();
    const rooms = await getRooms();

    if (rooms.length === 0) {
        return (
            <Typography
                sx={{
                    fontStyle: 'italic',
                }}
            >
                No active rooms
            </Typography>
        );
    }

    return (
        <List>
            {rooms.map((room) => (
                <ListItem key={room.slug}>
                    <Card variant="outlined">
                        <CardActionArea
                            href={`/rooms/${room.slug}`}
                            LinkComponent={Link}
                        >
                            <CardContent>
                                <Typography variant="h5">
                                    {room.name}
                                </Typography>
                                <Typography variant="caption">
                                    {room.slug}
                                </Typography>
                                <Typography>{room.game}</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </ListItem>
            ))}
        </List>
    );
}
