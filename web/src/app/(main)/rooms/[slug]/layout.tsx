import { ReactNode } from 'react';
import { RoomContextProvider } from '@/context/RoomContext';
import { serverFetch } from '../../../ServerUtils';
import { notFound, redirect } from 'next/navigation';
import { alertError } from '../../../../lib/Utils';
import { RoomData } from '@playbingo/types';

async function getRoom(slug: string): Promise<RoomData> {
    const res = await serverFetch(`/api/rooms/${slug}`);
    if (!res.ok) {
        if (res.status === 404) {
            notFound();
        } else {
            alertError(`Failed to load room - ${await res.text()}`);
            redirect('/');
        }
    }
    return res.json();
}

export default async function RoomLayout({
    params,
    children,
}: {
    params: Promise<{ slug: string }>;
    children: ReactNode;
    modal: ReactNode;
}) {
    const { slug } = await params;
    const room = await getRoom(slug);

    return (
        <>
            <RoomContextProvider serverRoomData={room}>
                {children}
            </RoomContextProvider>
        </>
    );
}
