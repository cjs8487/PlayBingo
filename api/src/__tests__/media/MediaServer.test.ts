import request from 'supertest';
import { app } from '../../main';
import { deleteFile, saveFile } from '../../media/MediaServer';
import { isOwner, slugForMedia } from '../../database/games/Games';
import { rm } from 'fs/promises';
import { getTestSessionCookie } from '../shared';

jest.mock('fs/promises', () => ({
    rm: jest.fn(),
}));

let ownerCookie = '';

beforeAll(async () => {
    ownerCookie = await getTestSessionCookie('player');
});

beforeEach(() => {
    jest.clearAllMocks();
    (isOwner as jest.Mock).mockResolvedValue(true);
    (slugForMedia as jest.Mock).mockResolvedValue('test-game');
});

describe('saveFile', () => {
    it('returns false when file is not pending', async () => {
        const res = await saveFile('non-existent-id');
        expect(res).toBe(false);
    });
});

describe('deleteFile', () => {
    it('deleteFile returns true on fs rm success and false on error', async () => {
        (rm as jest.Mock).mockResolvedValueOnce(undefined);
        let res = await deleteFile('game', 'file.png');
        expect(res).toBe(true);

        (rm as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
        res = await deleteFile('game', 'file.png');
        expect(res).toBe(false);
    });
});

describe('POST /media', () => {
    it('400 when no files are uploaded', async () => {
        const res = await request(app).post('/media').field('workflow', 'game');
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid number of files uploaded');
    });

    it('400 when workflow is missing', async () => {
        const res = await request(app)
            .post('/media')
            .field('workflow', '')
            .attach('file', Buffer.from('image bytes'), 'test.png');
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing file workflow');
    });

    it('400 when multiple files are uploaded under the same field', async () => {
        const res = await request(app)
            .post('/media')
            .field('workflow', 'game')
            .attach('file', Buffer.from('file1'), 'file1.png')
            .attach('file', Buffer.from('file2'), 'file2.png');
        expect(res.status).toBe(400);
        expect(res.text).toBe('Too many files uploaded');
    });

    it('200 and returns id on successful upload', async () => {
        const res = await request(app)
            .post('/media')
            .field('workflow', 'game')
            .attach('file', Buffer.from('image content'), 'test.png');
        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
        expect(typeof res.body.id).toBe('string');
        expect(res.body.id.endsWith('.png')).toBe(true);

        const fileId = res.body.id;
        const saveRes = await saveFile(fileId);
        expect(typeof saveRes).toBe('boolean');
    });
});

describe('DELETE /media/pending/:id', () => {
    it('400 when pending file does not exist', async () => {
        const res = await request(app).delete('/media/pending/fake-id.png');
        expect(res.status).toBe(400);
        expect(res.text).toBe('File does not exist');
    });

    it('200 when pending file exists and is removed', async () => {
        const uploadRes = await request(app)
            .post('/media')
            .field('workflow', 'game')
            .attach('file', Buffer.from('image content'), 'to-delete.png');
        const fileId = uploadRes.body.id;

        const res = await request(app).delete(`/media/pending/${fileId}`);
        expect(res.status).toBe(200);

        const res2 = await request(app).delete(`/media/pending/${fileId}`);
        expect(res2.status).toBe(400);
    });
});

describe('DELETE /media/:workflow/:id', () => {
    it('401 when user is not logged in', async () => {
        const res = await request(app)
            .delete('/media/game/file.png')
            .send({ workflow: 'game', id: 'file.png' });
        expect(res.status).toBe(401);
    });

    it('404 when slugForMedia returns null for game workflow', async () => {
        (slugForMedia as jest.Mock).mockResolvedValueOnce(null);

        const res = await request(app)
            .delete('/media/game/file.png')
            .set('Cookie', ownerCookie)
            .send({ workflow: 'game', id: 'file.png' });
        expect(res.status).toBe(404);
    });

    it('403 when user is not owner of game', async () => {
        (slugForMedia as jest.Mock).mockResolvedValueOnce('test-game');
        (isOwner as jest.Mock).mockResolvedValueOnce(false);

        const res = await request(app)
            .delete('/media/game/file.png')
            .set('Cookie', ownerCookie)
            .send({ workflow: 'game', id: 'file.png' });
        expect(res.status).toBe(403);
    });

    it('400 when workflow is invalid', async () => {
        const res = await request(app)
            .delete('/media/unknown/file.png')
            .set('Cookie', ownerCookie)
            .send({ workflow: 'unknown', id: 'file.png' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid media workflow');
    });

    it('200 when user is owner and workflow is game', async () => {
        (slugForMedia as jest.Mock).mockResolvedValueOnce('test-game');
        (isOwner as jest.Mock).mockResolvedValueOnce(true);

        const res = await request(app)
            .delete('/media/game/file.png')
            .set('Cookie', ownerCookie)
            .send({ workflow: 'game', id: 'file.png' });
        expect(res.status).toBe(200);
    });
});
