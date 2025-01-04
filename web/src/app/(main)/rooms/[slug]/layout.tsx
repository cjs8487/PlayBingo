import { ReactNode } from 'react';
import { RoomContextProvider } from '@/context/RoomContext';

export default async function RoomLayout(
    props: {
        params: Promise<{ slug: string }>;
        children: ReactNode;
    }
) {
    const params = await props.params;

    const {
        slug
    } = params;

    const {
        children
    } = props;

    return (
        <>
            <RoomContextProvider slug={slug}>{children}</RoomContextProvider>
        </>
    );
}
