import { Router } from 'express';
import {
    changePassword,
    emailUsed,
    getAllUsers,
    getUser,
    updateEmail,
    updateUsername,
    usernameUsed,
} from '../../database/Users';
import { requiresApiToken } from '../middleware';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { removeSessionsForUser } from '../../util/Session';
import { logWarn } from '../../Logger';
import { validatePassword } from '../../lib/Auth';

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

users.post('/:id/changePassword', requiresApiToken, async (req, res, next) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // user must be logged in to the site to change password
    if (!req.session.user) {
        logWarn('Password change attempt from a non-logged in user');
        return res.sendStatus(403);
    }

    // must be the logged in user changing their own password
    if (req.session.user !== id) {
        const offendingUser = await getUser(req.session.user);
        const targetUser = await getUser(id);
        logWarn(
            `${offendingUser?.username} attempted to change password for ${targetUser?.username}`,
        );
        return res.sendStatus(403);
    }

    if (!currentPassword) {
        return res.sendStatus(403);
    }

    if (!(await validatePassword(id, currentPassword))) {
        return res.status(403).send('Incorrect password ');
    }

    if (!newPassword) {
        return res.sendStatus(400);
    }

    const salt = randomBytes(16);
    const passwordHash = pbkdf2Sync(newPassword, salt, 10000, 64, 'sha256');
    await changePassword(id, passwordHash, salt);

    // end the current login session
    req.session.user = undefined;
    await new Promise<void>((resolve) =>
        req.session.save(() => {
            req.session.destroy(() => {
                resolve();
            });
        }),
    );

    // destroy all remaining sessions
    await removeSessionsForUser(id);

    res.sendStatus(200);
});

export default users;
