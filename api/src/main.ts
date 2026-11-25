import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { port, sessionSecret, testing } from './Environment';
import { logDebug, logError, logger, logInfo } from './Logger';
import { shutdownRoomDatabaseListeners } from './core/DatabaseEventListeners';
import { allRooms, roomWebSocketServer } from './core/RoomServer';
import { disconnect } from './database/Database';
import mediaServer from './media/MediaServer';
import api from './routes/api';
import { healthCheckRouter } from './routes/healthCheck';
import {
    bodySizeHistogram,
    metricsRouter,
    requestDurationHistogram,
} from './routes/metrics';
import { closeSessionDatabase, sessionStore } from './util/Session';

declare module 'express-session' {
    interface SessionData {
        user?: string;
    }
}

// export is needed for tests
export const app = express();

app.use(
    session({
        store: sessionStore,
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: !testing },
        proxy: !testing,
        unset: 'destroy',
    }),
);

app.use(bodyParser.json());

// Tracking duration of requests
app.use((req, res, next) => {
    const stopTimer = requestDurationHistogram.startTimer();
    if (req.body) {
        const bodySize = Buffer.byteLength(JSON.stringify(req.body));
        bodySizeHistogram.observe({ method: req.method }, bodySize);
    }
    res.on('finish', () => {
        stopTimer({
            route: req.route ? req.route.path : req.path,
            method: req.method,
            status_code: res.statusCode,
        });
    });
    next();
});

// request logger
app.use((req, res, next) => {
    // skip health and metrics
    if (req.path === '/api/health' || req.path === '/api/metrics') {
        return next();
    }
    const profiler = logger.startTimer();
    const requestPath = req.path;
    res.on('finish', () => {
        profiler.done({
            message: `${req.method} ${path} ${res.statusCode}`,
            method: req.method,
            path: requestPath,
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent') ?? '',
            ip: req.ip ?? '',
            statusCode: res.statusCode,
        });
    });
    next();
});

app.use(cors());
app.use('/media', mediaServer);

app.use(bodyParser.json());

app.use('/api', api);
app.use('/api/metrics', metricsRouter);
app.use('/api/health', healthCheckRouter);

app.use('/api/docs', express.static(path.join(__dirname, '..', '..', 'docs')));
app.use('/media', express.static(path.resolve('media')));

const server = app.listen(port, () => {
    logInfo(`API application listening on port ${port}`);
});

let shuttingDown = false;

server.on('upgrade', (req, socket, head) => {
    if (shuttingDown) {
        socket.destroy();
        return;
    }
    logInfo('[websocket] Client initiating protocol upgrade');
    if (!req.url) {
        socket.destroy();
        return;
    }
    const segments = req.url.split('/');
    segments.shift(); // remove leading empty segment
    if (segments.length < 2) {
        socket.destroy();
        return;
    }
    const [target, slug] = segments;
    if (target === 'socket') {
        const room = allRooms.get(slug);
        if (!room) {
            socket.destroy();
            return;
        }
        roomWebSocketServer.handleUpgrade(req, socket, head, (ws) => {
            roomWebSocketServer.emit('connection', ws, req);
            logInfo(`Successfully upgraded connection for ${slug}`);
        });
    } else {
        logInfo('[websocket] Unknown upgrade path');
        socket.destroy();
    }
});

const cleanup = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logInfo('Server shutting down');

    try {
        await Promise.all([
            new Promise<void>((resolve) => {
                roomWebSocketServer.close(() => {
                    logDebug('Room WebSocket server closed');
                    resolve();
                });
                logDebug('Closing open websocket connections');
                roomWebSocketServer.clients.forEach((client) => {
                    client.close();
                });
            }),
            new Promise<void>((resolve) => {
                logDebug('Closing open server connections');
                server.close(() => {
                    logDebug('HTTP server closed');
                    resolve();
                });
            }),
        ]);

        logInfo('Server closed.');

        logDebug('Writing pending room actions to database');
        await shutdownRoomDatabaseListeners();
        logDebug('Pending room actions written');

        logDebug('Closing database connection');
        await disconnect();
        logDebug('Database connection closed');

        logDebug('Closing session database connection');
        closeSessionDatabase();
        logDebug('Session database connection closed');
        process.exit(0);
    } catch (error) {
        logError(`Server shutdown failed - ${error}`);
        process.exit(1);
    }
};

process.on('exit', () => {
    logInfo('API server shut down');
});

process.on('SIGHUP', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.once('SIGUSR2', cleanup);
