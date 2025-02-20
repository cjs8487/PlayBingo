'use client';
import { ReactNode } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Modal({ children }: { children: ReactNode }) {
    const router = useRouter();
    return (
        <Dialog open onClose={() => router.back()}>
            <DialogContent sx={{ p: 4 }}>{children}</DialogContent>
        </Dialog>
    );
}
