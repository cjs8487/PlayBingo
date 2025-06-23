import 'dotenv/config';

export const port = process.env.PORT || 8000;
export const testing = !!process.env.TESTING;
export const roomTokenSecret = process.env.ROOM_TOKEN_SECRET || '';
export const roomCleanupInterval =
    Number(process.env.ROOM_CLEANUP_INTERVAL) || 1000 * 60 * 60;
export const roomCleanupInactive =
    Number(process.env.ROOM_CLEANUP_INACTIVE) || 1000 * 60 * 60 * 3;
export const sessionSecret = process.env.SESSION_SECRET || '';
export const clientUrl = process.env.CLIENT_URL ?? '';
export const smtpHost = process.env.SMTP_HOST ?? '';
export const smtpUser = process.env.SMTP_USER ?? '';
export const smtpPassword = process.env.SMTP_PASSWORD ?? '';
export const urlBase = process.env.URL_BASE ?? '';
export const eApiKey = process.env.E_API_KEY;

//racetime integration
export const racetimeClientId = process.env.RT_CLIENT_ID ?? '';
export const racetimeClientSecret = process.env.RT_CLIENT_SECRET ?? '';
export const racetimeHost = process.env.RT_HOST ?? 'racetime.gg';
