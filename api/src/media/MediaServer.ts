import { randomUUID } from 'crypto';
import { Router } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import path from 'path';

const mediaServer = Router();

interface PendingFileData {
    file: UploadedFile;
    workflow: string;
    timeout: NodeJS.Timeout;
}

const pendingFiles: Record<string, PendingFileData> = {};

const pendFile = (file: UploadedFile, workflow: string) => {
    const id = `${randomUUID()}${path.extname(file.name)}`;
    pendingFiles[id] = {
        file,
        workflow,
        timeout: setTimeout(
            () => {
                delete pendingFiles[id];
            },
            5 * 60 * 1000,
        ),
    };
    return id;
};

export const saveFile = async (id: string) => {
    const pendingFile = pendingFiles[id];
    if (!pendingFile) {
        return false;
    }

    const { file, workflow, timeout } = pendingFile;

    clearTimeout(timeout);

    const success = await new Promise((resolve) => {
        file.mv(path.resolve('media', workflow, id), (err) => {
            if (err) {
                console.log(err);
                resolve(false);
            } else {
                delete pendingFiles[id];
                resolve(true);
            }
        });
    });

    return success;
};

mediaServer.use(fileUpload());

mediaServer.post('/', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
        return;
    }

    const { workflow } = req.body;
    if (!workflow) {
        res.status(400).send('Missing file workflow');
        return;
    }

    const ids: string[] = [];
    Object.keys(req.files).forEach((k) => {
        if (!req.files) return;

        if (Array.isArray(req.files[k])) {
            req.files[k].forEach((file) => {
                ids.push(pendFile(file, workflow));
            });
        } else {
            ids.push(pendFile(req.files[k], workflow));
        }
    });

    res.status(200).send({ ids });
});

mediaServer.delete('/pending/:id', (req, res) => {
    const { id } = req.params;

    if (!pendingFiles[id]) {
        res.status(400).send('File does not exist');
        return;
    }

    delete pendingFiles[id];

    res.sendStatus(200);
});

export default mediaServer;
