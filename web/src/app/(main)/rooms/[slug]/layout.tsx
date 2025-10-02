import { RoomContextProvider } from '@/context/RoomContext';
import { RoomData } from '@playbingo/types';
import { notFound, redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { alertError } from '../../../../lib/Utils';
import { serverGet } from '../../../ServerUtils';

async function getRoom(slug: string): Promise<RoomData> {
    const res = await serverGet(`/api/rooms/${slug}`);
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
