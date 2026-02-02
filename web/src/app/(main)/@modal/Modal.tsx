'use client';
import { Dialog, DialogContent, SxProps } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    sx?: SxProps;
    fullWidth?: boolean;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ children, sx, fullWidth, maxWidth }: Props) {
    const router = useRouter();
    return (
        <Dialog
            open
            onClose={() => router.back()}
            fullWidth={fullWidth}
            maxWidth={maxWidth}
        >
            <DialogContent sx={sx}>{children}</DialogContent>
        </Dialog>
    );
}
