import { Router } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

export const metricsRouter = Router()
const registry = new Registry()

collectDefaultMetrics({ register: registry });

export const requestDurationHistogram = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
});

// Insert any other metrics we might want

metricsRouter.get('/', async(req, res) => {{
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
}})
