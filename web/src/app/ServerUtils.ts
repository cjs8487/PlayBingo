import { cookies } from 'next/headers';
import parser from 'set-cookie-parser';
import { getFullUrl } from '../lib/Utils';
/**
 * Fetch function that should be used for all fetches sent from the Next web
 * server to the API server, including for server rendering. This version of
 * fetch handles forwarding cookies on both the outgoing request to the API
 * server as well as forwarding Set-Cookie headers from the response to the
 * client, which ensures session continuity. It also sets the special API
 * key into the Authentication header that gives the website access to
 * protected endpoints, such as session and user management endpoints.
 *
 * @param path The path to send the fetch to. This can be a relative path or
 *  an absolute URL. Relative paths are assumed to be relative to the same
 *  api root as the proxy.
 * @param init Request properties. Values in this parameter are forwarded to
 *  the actual fetch call, but may be modified. Certain values may always be
 *  overwritten, such as the Content-Type and Authentication headers
 * @returns The fetch response object
 */
export const serverFetch = async (path: string, init?: RequestInit) => {
    const res = await fetch(getFullUrl(path), {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            'Content-Type': 'application/json',
            'PlayBingo-Api-Key': process.env.API_KEY ?? '',
            // forward client cookies
            cookie: (await cookies())
                .getAll()
                .map((c) => `${c.name}=${c.value}`)
                .join('; '),
        },
    });

    // forward response cookies to the client
    await Promise.all(
        parser(res.headers.getSetCookie()).map(async (cookie) => {
            (await cookies()).set({
                name: cookie.name,
                value: cookie.value,
                httpOnly: cookie.httpOnly,
                path: cookie.path,
            });
        }),
    );

    return res;
};

export const serverGet = async (path: string, init?: RequestInit) => {
    const res = await fetch(getFullUrl(path), {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            'PlayBingo-Api-Key': process.env.API_KEY ?? '',
            // forward client cookies
            cookie: (await cookies())
                .getAll()
                .map((c) => `${c.name}=${c.value}`)
                .join('; '),
        },
    });
    return res;
};
