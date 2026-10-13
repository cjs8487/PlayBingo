import { DateTime } from 'luxon';

export type MetadataFilter = {
    key: string;
    value: string | number | boolean | null;
    exclude: boolean;
};
export type LogRecord = {
    id: number;
    timestamp: string;
    time: number;
    level: string;
    message: string;
    source?: string;
    metadata: Record<string, unknown>;
    raw: unknown;
};
export const defaultLevels = ['info', 'warn', 'error'];
export const isScalar = (value: unknown): value is MetadataFilter['value'] =>
    value === null || ['string', 'number', 'boolean'].includes(typeof value);
export function formatValue(value: unknown): string {
    return typeof value === 'string'
        ? value
        : (JSON.stringify(value, null, 2) ?? String(value));
}
export function normalizeLogs(entries: unknown[]): LogRecord[] {
    return entries.map((raw, id) => {
        const entry =
            raw && typeof raw === 'object' && !Array.isArray(raw)
                ? (raw as Record<string, unknown>)
                : {};
        const {
            timestamp,
            level,
            message,
            source,
            category,
            component,
            ...metadata
        } = entry;
        const time =
            typeof timestamp === 'string'
                ? DateTime.fromISO(timestamp).toMillis()
                : NaN;
        const origin = source ?? category ?? component;
        return {
            id,
            raw,
            timestamp:
                typeof timestamp === 'string' ? timestamp : 'Unknown timestamp',
            time,
            level: typeof level === 'string' ? level.toLowerCase() : 'unknown',
            message:
                message === undefined
                    ? Object.keys(entry).length
                        ? '(No message)'
                        : formatValue(raw)
                    : formatValue(message),
            source: typeof origin === 'string' ? origin : undefined,
            metadata: {
                ...metadata,
                ...(source !== undefined ? { source } : {}),
                ...(category !== undefined ? { category } : {}),
                ...(component !== undefined ? { component } : {}),
            },
        };
    });
}
export function filterLogs(
    logs: LogRecord[],
    levels: string[],
    search: string,
    filters: MetadataFilter[],
    newest: boolean,
): LogRecord[] {
    const query = search.trim().toLowerCase();
    return logs
        .filter(
            (log) =>
                levels.includes(log.level) &&
                (!query ||
                    log.message.toLowerCase().includes(query) ||
                    Object.values(log.metadata).some(
                        (value) =>
                            typeof value === 'string' &&
                            value.toLowerCase().includes(query),
                    )) &&
                filters.every((filter) =>
                    filter.exclude
                        ? log.metadata[filter.key] !== filter.value
                        : log.metadata[filter.key] === filter.value,
                ),
        )
        .sort((a, b) => {
            const aValid = Number.isFinite(a.time);
            const bValid = Number.isFinite(b.time);
            if (aValid !== bValid) return aValid ? -1 : 1;
            const comparison =
                aValid && bValid ? a.time - b.time || a.id - b.id : a.id - b.id;
            return newest ? -comparison : comparison;
        });
}
export function previewMetadata(log: LogRecord) {
    const priority = [
        'room',
        'player',
        'method',
        'path',
        'statusCode',
        'durationMs',
        'attempt',
        'error',
        'sessionId',
    ];
    return Object.entries(log.metadata)
        .filter(
            ([key, value]) =>
                !['source', 'category', 'component', 'stack', 'trace'].includes(
                    key,
                ) && isScalar(value),
        )
        .sort(
            ([a], [b]) =>
                (priority.includes(a) ? priority.indexOf(a) : priority.length) -
                (priority.includes(b) ? priority.indexOf(b) : priority.length),
        )
        .slice(0, 3);
}
