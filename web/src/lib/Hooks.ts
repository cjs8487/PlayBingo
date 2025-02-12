'use client';
import useSWR from 'swr';

export const useApi = <T>(route: string, immutable?: boolean) => {
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
