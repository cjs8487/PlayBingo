import { serverGet } from '../../../ServerUtils';
import LogViewer from './_components/LogViewer';

async function getLogs(): Promise<{
    logs: unknown[];
    error: string | null;
}> {
    try {
        const response = await serverGet('/api/logs', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Log retrieval failed');
        }
        const logs: unknown = await response.json();
        if (!Array.isArray(logs)) {
            throw new Error('Unexpected log response');
        }
        return { logs, error: null };
    } catch {
        return {
            logs: [],
            error: 'Unable to retrieve server logs. Try refreshing.',
        };
    }
}

export default async function Logs() {
    const result = await getLogs();
    return <LogViewer initialLogs={result.logs} initialError={result.error} />;
}
