import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import { getSiteAuth, getSiteAuthId } from '../database/Users';

export const validatePassword = async (userId: string, password: string) => {
    const auth = await getSiteAuthId(userId);
    if (!auth) {
        return false;
    }

    const suppliedHash = hashPassword(password, auth.salt);
    return timingSafeEqual(auth.password, suppliedHash);
};

export const validateUsernamePasswordCombo = async (
    username: string,
    password: string,
) => {
    const auth = await getSiteAuth(username);
    if (!auth) {
        return false;
    }

    const suppliedHash = hashPassword(password, auth.salt);
    return timingSafeEqual(auth.password, suppliedHash);
};

const hashPassword = (password: string, salt: Uint8Array) => {
    return pbkdf2Sync(password, salt, 10000, 64, 'sha256');
};
