import { Counter, Gauge, Histogram } from 'prom-client';
import { registry } from './metrics';

const totalConnections = new Counter({
    name: 'websocket_connections_total',
    help: 'Total number of websocket connections established',
    registers: [registry],
});

const activeConnections = new Gauge({
    name: 'websocket_connections_active',
    help: 'Total number of active websocket connections',
    registers: [registry],
});

const disconnectReasons = new Counter({
    name: 'websocket_disconnect_reasons',
    help: 'Number of websocket disconnects by reason code',
    registers: [registry],
    labelNames: ['code'],
});

const messageReceivedCounter = new Counter({
    name: 'websocket_messages_received',
    labelNames: ['action'],
    help: 'Number of websocket messages received',
    registers: [registry],
});

const messageSentCounter = new Counter({
    name: 'websocket_messages_sent',
    labelNames: ['message_type'],
    help: 'Number of websocket messages sent',
    registers: [registry],
});

const connectionDurationHistogram = new Histogram({
    name: 'websocket_connection_duration',
    help: 'Duration of websocket connections in seconds',
    registers: [registry],
    buckets: [
        60,
        60 * 5,
        60 * 15,
        60 * 30,
        60 * 60,
        60 * 60 * 2,
        60 * 60 * 3,
        60 * 60 * 5,
        60 * 60 * 6,
        60 * 60 * 8,
        60 * 60 * 12,
        60 * 60 * 24,
    ],
});

const messageProcessingDurationHistogram = new Histogram({
    name: 'websocket_message_processing_duration_seconds',
    labelNames: ['action'],
    help: 'Duration of websocket message processing in seconds',
    registers: [registry],
    buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const websocketOpened = () => {
    activeConnections.inc();
    totalConnections.inc();
    return connectionDurationHistogram.startTimer();
};

export const websocketClosed = (
    closeCode: number,
    stopTimer: ReturnType<typeof connectionDurationHistogram.startTimer>,
) => {
    activeConnections.dec();
    disconnectReasons.inc({ code: closeCode.toString() });
    stopTimer();
};

export const messageReceived = (action: string) => {
    messageReceivedCounter.inc({ action });
    return messageProcessingDurationHistogram.startTimer({ action });
};

export const messageSent = (messageType: string) => {
    messageSentCounter.inc({ message_type: messageType });
};
