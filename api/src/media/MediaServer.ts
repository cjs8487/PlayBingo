import { randomUUID } from 'crypto';
import { Router } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';

const mediaServer = Router();

mediaServer.use(fileUpload());

mediaServer.post('/', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    res.sendStatus(200);
});

export default mediaServer;
