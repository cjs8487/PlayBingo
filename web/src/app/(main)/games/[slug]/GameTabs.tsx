'use client';

import { Box } from '@mui/material';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

interface Props {
    slug: string;
}

export default function GameTabs({ slug }: Props) {
    const segment = useSelectedLayoutSegment();
    console.log(segment);
    return (
        <Box>
            <Link href={`/games/${slug}/overview`}>Overview</Link>
            <Link href={`/games/${slug}/goals`}>Goals</Link>
        </Box>
    );
}
