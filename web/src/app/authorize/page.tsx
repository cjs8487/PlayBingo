import { OAuthClient } from '@playbingo/types';
import { serverGet } from '../ServerUtils';
import Authorize from './_components/Authorize';

async function getClient(
    clientId: string,
    redirectUri: string,
): Promise<{ transactionId: string; client: OAuthClient } | undefined> {
    const res = await serverGet(
        `/api/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`,
    );
    if (res.ok) {
        return res.json();
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

    const response = await getClient(clientId, redirectUri);
    if (!response) {
        return 'unable to start authorization flow';
    }

    const { transactionId, client } = response;

    if (!client.redirectUris.includes(redirectUri)) {
        return 'unknown redirect uri';
    }

    const scopeList = scopes.split(' ');

    return (
        <Authorize
            client={client}
            scopes={scopeList}
            redirectUri={redirectUri}
            transactionId={transactionId}
        />
    );
}
