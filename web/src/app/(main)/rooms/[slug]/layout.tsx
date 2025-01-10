import { ReactNode } from 'react';
import { RoomContextProvider } from '@/context/RoomContext';
import { notFound } from 'next/navigation';

async function loadRoom(slug: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/rooms/${slug}`,
    );

    if (!res.ok) {
        if (res.status === 404) {
            return notFound();
        }
    }

    return {};
}

export default async function RoomLayout({
    params,
    children,
}: {
    params: Promise<{ slug: string }>;
    children: ReactNode;
}) {
    const { slug } = await params;

    const roomData = await loadRoom(slug);

    return <RoomContextProvider slug={slug}>{children}</RoomContextProvider>;
}
