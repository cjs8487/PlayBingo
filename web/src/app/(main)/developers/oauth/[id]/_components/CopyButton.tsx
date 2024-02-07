'use client';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';
import { useCopyToClipboard } from 'react-use';

export default function CopyButton({ value }: { value: string }) {
    const [state, copyToClipboard] = useCopyToClipboard();
    const [copied, setCopied] = useState(false);

    const copy = useCallback(() => {
        copyToClipboard(value);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [value, copyToClipboard, setCopied]);

    if (copied && state.error) {
        return <Button color="error">Unable to copy</Button>;
    }
    if (copied && state.value) {
        return <Button color="success">Copied</Button>;
    }
    return <Button onClick={copy}>Copy</Button>;
}
