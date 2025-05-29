import { Router } from 'express';
import { allRooms } from '../../../core/RoomServer';
import { createRoomToken } from '../../../auth/RoomAuth';

const ebs = Router();

ebs.post('/:slug/authorize', (req, res) => {
    const { slug } = req.params;
    const room = allRooms.get(slug);
    if (!room) {
        res.sendStatus(404);
        return;
    }
    // if (password !== room.password) {
    //     res.sendStatus(403);
    //     return;
    // }

    const token = createRoomToken(room, { isSpectating: true });
    res.status(200).send({ authToken: token });
});

export default ebs;
