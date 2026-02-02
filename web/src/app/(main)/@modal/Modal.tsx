'use client';
import { Dialog, DialogContent, SxProps } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    sx?: SxProps;
}

export default function Modal({ children, sx }: Props) {
    const router = useRouter();
    return (
        <Dialog open onClose={() => router.back()}>
            <DialogContent sx={sx}>{children}</DialogContent>
        </Dialog>
    );
}
