'use client';
import useSWR, { SWRResponse } from 'swr';

export const useApi = <T>(route: string, immutable?: boolean): SWRResponse<T> => {
    const options = {
        revalidateIfStale: !immutable,
        revalidateOnFocus: !immutable,
        revalidateOnReconnect: !immutable,
    };
    return useSWR<T>(
        route,
        (path) =>
            fetch(path).then((res) => {
                if (!res.ok) {
                    if (res.status === 404) {
                        return undefined;
                    }
                }
                return res.json();
            }),
        options,
    );
};
