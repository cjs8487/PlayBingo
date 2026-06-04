import { OAuthClient } from '@playbingo/types';
import { serverGet } from '../ServerUtils';
import Authorize from './_components/Authorize';
import { redirect } from 'next/navigation';

export const allScopes = [
    'rooms:join',
    'rooms:act',
    'categories:moderate',
    'profile:read',
    'profile:write',
];

async function getClient(
    clientId: string,
    redirectUri: string,
    scopes: string,
): Promise<{ transactionId: string; client: OAuthClient } | undefined> {
    const res = await serverGet(
        `/api/oauth/authorize?clientId=${clientId}&redirectUri=${redirectUri}&scopes=${scopes}&responseType=code`,
    );
    if (res.ok) {
        return res.json();
    }
    if (res.status === 401) {
        redirect('/login');
    }
    return undefined;
}

export default async function AuthorizePage({
    searchParams,
}: PageProps<'/authorize'>) {
    const { clientId, scopes, redirectUri } = await searchParams;

    if (!clientId) {
        return 'missing client id';
    }
    if (typeof clientId !== 'string') {
        return 'invalid client id';
    }
    if (!scopes) {
        return 'no scopes specified';
    }
    if (typeof scopes !== 'string') {
        return 'invalid scope list';
    }
    if (!redirectUri) {
        return 'missing redirect uri';
    }
    if (typeof redirectUri !== 'string') {
        return 'invalid redirect uri';
    }

    const response = await getClient(clientId, redirectUri, scopes);
    if (!response) {
        return 'unable to start authorization flow';
    }

    const { transactionId, client } = response;

    if (!client.redirectUris.includes(redirectUri)) {
        return 'unknown redirect uri';
    }

    const scopeList = scopes.split(' ');
    for (const scope of scopeList) {
        if (!allScopes.includes(scope)) {
            return 'unknown scope: ' + scope;
        }
    }

    return (
        <Authorize
            client={client}
            scopes={scopeList}
            redirectUri={redirectUri}
            transactionId={transactionId}
        />
    );
}
