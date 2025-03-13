import { Router } from 'express';
import {
    emailUsed,
    getAllUsers,
    getUser,
    updateEmail,
    updateUsername,
    usernameUsed,
} from '../../database/Users';
import { requiresApiToken } from '../middleware';

const users = Router();

users.get('/', async (req, res) => {
    const userList = await getAllUsers();
    res.status(200).json(userList);
});

users.route('/:id').post(requiresApiToken, async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;

    if (!username && !email) {
        return res.status(400).send('Missing profile update data');
    }

    const user = await getUser(id, true);
    if (!user) {
        return res.sendStatus(404);
    }

    if (username === user.username && email === user.email) {
        return res.status(400).send('No changes made');
    }

    let shouldUpdateUsername,
        shouldUpdateEmail = false;

    if (username) {
        if (typeof username !== 'string') {
            return res.status(400).send('Invalid username format');
        }
        if (username !== user.username) {
            if (await usernameUsed(username)) {
                return res.status(400).send('Username unavailable');
            }
            shouldUpdateUsername = true;
        }
    }

    if (email) {
        if (typeof email !== 'string') {
            return res.status(400).send('Invalid email format');
        }
        console.log(email);
        console.log(user.email);
        if (email !== user.email) {
            if (await emailUsed(email)) {
                return res.status(400).send('Email unavailable');
            }
            shouldUpdateEmail = true;
        }
    }

    let resUser;
    if (shouldUpdateUsername) {
        resUser = await updateUsername(id, username);
    }
    if (shouldUpdateEmail) {
        resUser = await updateEmail(id, email);
    }

    res.status(200).send(resUser);
});

export default users;
