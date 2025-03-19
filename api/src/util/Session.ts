import Database, { Database as DB } from 'better-sqlite3';
import SqliteStore from 'better-sqlite3-session-store';
import session, { SessionData } from 'express-session';

// configure session store
const sessionDb: DB = new Database('sessions.db');
export const sessionStore = new (SqliteStore(session))({
    client: sessionDb,
    expired: {
        clear: true,
        intervalMs: 900000,
    },
});

export const removeSessionsForUser = (user: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // better-sqlite3-session-store defines all, but it is optional
        if (sessionStore.all) {
            sessionStore.all(async (err, sessions) => {
                if (err) {
                    reject(err);
                    return;
                }
                // similarly this will always be an array for our purposes
                const toDelete: string[] = [];
                if (Array.isArray(sessions)) {
                    if (sessions) {
                        // better-sqlite3-session-store is incorrectly implemented
                        // and does  not return a SessionData[] so we need to coerce
                        // it to the "correct" type
                        (
                            sessions as unknown as {
                                sid: string;
                                sess: string;
                            }[]
                        )?.forEach(({ sid, sess }) => {
                            const ses: SessionData = JSON.parse(sess);
                            if (user === ses.user) {
                                toDelete.push(sid);
                            }
                        });
                    }
                }
                await Promise.all(
                    toDelete.map(
                        (sid) =>
                            new Promise<void>((resolve) => {
                                sessionStore.destroy(sid);
                                resolve();
                            }),
                    ),
                );
                resolve();
            });
        } else {
            reject();
        }
    });
};

export const closeSessionDatabase = () => {
    sessionDb.close();
};
