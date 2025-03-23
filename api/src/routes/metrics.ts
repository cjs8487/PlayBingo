import { Router } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

export const metricsRouter = Router();
const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const requestDurationHistogram = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
});

export const bodySizeHistogram = new Histogram({
    name: 'http_request_body_size',
    help: 'Size of HTTP request body in bytes',
    buckets: [
        1,
        10,
        100,
        512,
        1024,
        1024 * 5,
        1024 * 10,
        1024 * 100,
        1024 * 1024,
        1024 * 1024 * 5,
    ],
    labelNames: ['method'],
    registers: [registry],
});

// Insert any other metrics we might want

metricsRouter.get('/', async (req, res) => {
    {
        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
    }
});
