import { ReactNode } from 'react';
import { RoomContextProvider } from '@/context/RoomContext';
import { notFound } from 'next/navigation';
import { RoomData } from '../../../../types/RoomData';

async function loadRoom(slug: string): Promise<RoomData> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/rooms/${slug}`,
    );

    if (!res.ok) {
        if (res.status === 404) {
            return notFound();
        }
    }

    return res.json();
}

export default async function RoomLayout({
    params,
    children,
    modal,
}: {
    params: Promise<{ slug: string }>;
    children: ReactNode;
    modal: ReactNode;
}) {
    const { slug } = await params;

    const roomData = await loadRoom(slug);

    return (
        <RoomContextProvider slug={slug} roomData={roomData}>
            {children}
            {modal}
        </RoomContextProvider>
    );
}
