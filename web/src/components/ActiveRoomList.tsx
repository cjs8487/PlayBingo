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
import { use } from 'react';
import CacheBreaker from './CacheBreaker';

async function getRooms(): Promise<RoomData[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/rooms`);
    return res.json();
}

export default function ActiveRoomList() {
    const rooms = use(getRooms());

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
            <CacheBreaker />
        </List>
    );
}
