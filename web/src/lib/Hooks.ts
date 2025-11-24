'use client';
import useSWR, { SWRResponse } from 'swr';

export const useApi = <T>(
    route: string,
    {
        immutable,
        onSuccess,
    }: { immutable?: boolean; onSuccess?: (data: T) => void } = {},
): SWRResponse<T> => {
    const options = {
        revalidateIfStale: !immutable,
        revalidateOnFocus: !immutable,
        revalidateOnReconnect: !immutable,
        onSuccess,
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
