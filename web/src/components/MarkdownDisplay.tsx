'use client';

import MDEditor from '@uiw/react-md-editor';

interface Props {
    source: string;
}

export default function MarkdownDisplay({ source }: Props) {
    return (
        <MDEditor.Markdown
            source={source}
            data-color-mode="dark"
            style={{ background: 'inherit' }}
        />
    );
}
