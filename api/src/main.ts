import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { port, sessionSecret, testing } from './Environment';
import { logDebug, logger, logInfo } from './Logger';
import {
    allRooms,
    handleRoomUpgrade,
    roomWebSocketServer,
} from './core/RoomServer';
import { disconnect } from './database/Database';
import mediaServer from './media/MediaServer';
import api from './routes/api';
import { healthCheckRouter } from './routes/healthCheck';
import { metricsRouter } from './routes/metrics';
import { closeSessionDatabase, sessionStore } from './util/Session';
import metrics from './metrics';

declare module 'express-session' {
    interface SessionData {
        user?: string;
    }
}

// export is needed for tests
export const app = express();

// Tracking duration of requests
app.use((req, res, next) => {
    metrics.http.observeRequest(req, res);
    next();
});

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

// request logger
app.use((req, res, next) => {
    // skip health and metrics
    if (req.path === '/api/health' || req.path === '/api/metrics') {
        return next();
    }
    const profiler = logger.startTimer();
    const path = req.path;
    res.on('finish', () => {
        profiler.done({
            message: `${req.method} ${path} ${res.statusCode}`,
            method: req.method,
            path,
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

server.on('upgrade', handleRoomUpgrade);

const cleanup = async () => {
    logDebug('Server shutting down');
    allRooms.forEach((room) => room.close('shutdown'));
    await Promise.all([
        new Promise((resolve) => {
            roomWebSocketServer.close(() => {
                logDebug('Room WebSocket server closed');
                resolve(undefined);
            });
            logDebug('Closing open websocket connections');
            roomWebSocketServer.clients.forEach((client) => {
                client.close();
            });
        }),
        new Promise((resolve) => {
            server.close(() => {
                logDebug('HTTP server closed');
                resolve(undefined);
            });
            logDebug('Closing open server connections');
            server.closeAllConnections();
        }),
        new Promise(async (resolve) => {
            logDebug('Closing database connection');
            await disconnect();
            logDebug('Database connection closed');
            resolve(undefined);
        }),
        new Promise((resolve) => {
            logDebug('Closing session database connection');
            closeSessionDatabase();
            logDebug('Session database connection closed');
            resolve(undefined);
        }),
    ]);
    process.exit(0);
};

process.on('exit', () => {
    logInfo('API server shut down');
});

process.on('SIGHUP', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.once('SIGUSR2', cleanup);
