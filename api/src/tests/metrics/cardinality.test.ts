import express from 'express';
import request from 'supertest';
import metrics from '../../metrics';

beforeEach(() => metrics.registry.resetMetrics());

it('groups dynamic and unmatched HTTP paths', async () => {
    const app = express();
    app.use((req, res, next) => {
        metrics.http.observeRequest(req, res);
        next();
    });
    app.get('/rooms/:slug', (_req, res) => res.sendStatus(200));
    for (let i = 0; i < 5; i++) {
        await request(app).get(`/rooms/room-${i}`);
        await request(app).get(`/missing-${i}`);
    }
    const output = await metrics.registry.metrics();
    expect(output).toContain(
        'http_requests_total{route="/rooms/:slug",method="GET",status_code="200"} 5',
    );
    expect(output).toContain(
        'http_requests_total{route="unmatched",method="GET",status_code="404"} 5',
    );
    expect(output).not.toContain('room-0');
    expect(output).not.toContain('missing-0');
});

it('preserves websocket protocol labels without room labels', async () => {
    for (let i = 0; i < 5; i++) {
        const stopConnection = metrics.websocket.websocketOpened();
        metrics.websocket.messageReceived('chat')();
        metrics.websocket.messageSent('pong');
        metrics.websocket.websocketClosed(1000, stopConnection);
    }
    const output = await metrics.registry.metrics();
    expect(output).toContain('websocket_connections_total 5');
    expect(output).toContain('websocket_connections_active 0');
    expect(output).toContain('websocket_disconnect_reasons{code="1000"} 5');
    expect(output).not.toContain('room=');
    expect(output).toContain('websocket_messages_received{action="chat"} 5');
    expect(output).toContain('websocket_messages_sent{message_type="pong"} 5');
    expect(output).toContain(
        'websocket_message_processing_duration_seconds_count{action="chat"} 5',
    );
});
