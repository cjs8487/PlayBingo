'use client';

import { Button } from '@mui/material';
import { alertError } from '../../../lib/Utils';

interface DisconnectButtonProps {
    disconnect: () => Promise<{ ok: boolean; status: number }>;
}

export default function DiscconectButton({
    disconnect,
}: DisconnectButtonProps) {
    return (
        <Button
            color="error"
            className="rounded-md bg-red-500 px-1 py-0.5 text-xs"
            onClick={async () => {
                const res = await disconnect();
                if (!res.ok) {
                    alertError('Unable to disconnect from racetime.gg');
                }
            }}
        >
            Disconnect
        </Button>
    );
}
