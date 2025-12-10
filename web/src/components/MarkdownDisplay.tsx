'use client';

import { Box } from '@mui/material';
import MDEditor from '@uiw/react-md-editor';

interface Props {
    source: string;
}

export default function MarkdownDisplay({ source }: Props) {
    return (
        <Box data-color-mode="dark">
            <MDEditor.Markdown
                source={source}
                style={{ background: 'inherit' }}
            />
        </Box>
    );
}
