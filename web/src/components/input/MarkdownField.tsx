import { useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { TextField, Box, Typography, Collapse, Button } from '@mui/material';
import { useField, useFormikContext } from 'formik';
import MDEditor from '@uiw/react-md-editor';

interface Props {
    name: string;
}

export function MarkdownField({ name }: Props) {
    const [field, meta, { setValue }] = useField<string>({ name });

    return (
        <MDEditor
            value={field.value}
            onChange={(value) => setValue(value ?? '')}
            onBlur={field.onBlur}
            style={{ background: 'none' }}
            data-color-mode="dark"
        />
    );
}
