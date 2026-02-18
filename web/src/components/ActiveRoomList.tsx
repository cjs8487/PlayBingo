import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { RoomData } from '@playbingo/types';
import { connection } from 'next/server';
import { serverGet } from '../app/ServerUtils';
import { getFullUrl } from '../lib/Utils';

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

    console.log(rooms);

    return (
        <List>
            {rooms.map((room) => (
                <ListItem key={room.slug}>
                    <Card variant="outlined">
                        <CardActionArea
                            href={`/rooms/${room.slug}`}
                            sx={{
                                display: 'flex',
                            }}
                        >
                            <CardMedia
                                component="img"
                                image={getFullUrl(
                                    `/media/gameCover/${room.gameSlug}`,
                                )}
                                sx={{
                                    width: '120px',
                                    aspectRatio: '11 / 16',
                                    objectFit: 'cover',
                                }}
                            />
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
