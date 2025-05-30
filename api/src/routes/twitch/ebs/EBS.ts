import { Router } from 'express';
import { allRooms } from '../../../core/RoomServer';
import { createRoomToken } from '../../../auth/RoomAuth';
import { verify } from 'jsonwebtoken';
import { ebsSecret } from '../../../Environment';

const ebs = Router();

ebs.post('/:slug/authorize', (req, res) => {
    const { slug } = req.params;
    const [type, jwt] = (req.headers['authorization'] ?? '').split(' ');
    if (type !== 'Bearer') {
        res.sendStatus(400);
        return;
    }
    console.log(jwt);
    if (!jwt) {
        res.sendStatus(401);
        return;
    }
    try {
        const payload = verify(jwt, ebsSecret);
        console.log(payload);
    } catch {
        res.sendStatus(403);
        return;
    }
    const room = allRooms.get(slug);
    if (!room) {
        res.sendStatus(404);
        return;
    }

    const token = createRoomToken(room, { isSpectating: true });
    res.status(200).send({ authToken: token });
});

export default ebs;
