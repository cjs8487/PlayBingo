'use client';

import { useField } from 'formik';
import { useDropzone } from 'react-dropzone';
import { alertError, getFullUrl } from '../../lib/Utils';
import { Box, IconButton, SxProps, Theme, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import FileUpload from '@mui/icons-material/FileUpload';
import Close from '@mui/icons-material/Close';

const baseStyle: SxProps<Theme> = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 2,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: 'divider',
    borderStyle: 'dashed',
    color: (theme) => theme.palette.text.secondary,
    outline: 'none',
    transition: 'border .24s ease-in-out',
    cursor: 'pointer',
    ':hover': {
        backgroundColor: (theme) => theme.palette.action.hover,
        borderColor: (theme) => theme.palette.action.focus,
    },
    width: '100%',
    height: '100%',
};

const focusedStyle: SxProps<Theme> = {
    borderColor: (theme) => theme.palette.primary.main,
};

const acceptStyle: SxProps<Theme> = {
    borderColor: (theme) => theme.palette.success.main,
};

const rejectStyle: SxProps<Theme> = {
    borderColor: '#ff1744',
};

const uploadedStyle: SxProps<Theme> = {
    border: 'none',
    padding: 0,
};

interface Props {
    name: string;
    workflow: string;
}

export default function FormikFileUpload({ name, workflow }: Props) {
    const [{ value }, _meta, { setValue }] = useField<string>(name);
    const [file, setFile] = useState<{ preview: string }>();
    const [uploading, setUploading] = useState(false);

    const {
        getRootProps,
        getInputProps,
        isFocused,
        isDragAccept,
        isDragReject,
        isDragActive,
    } = useDropzone({
        onDrop: async (acceptedFiles) => {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', acceptedFiles[0]);
            formData.append('workflow', workflow);
            const res = await fetch(getFullUrl('/media'), {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                return alertError(
                    `Unable to upload file - ${await res.text()}`,
                );
            }

            const { ids } = await res.json();
            setValue(ids[0]);
            setFile({ preview: URL.createObjectURL(acceptedFiles[0]) });
            setUploading(false);
        },
        maxFiles: 1,
        accept: {
            'image/jpeg': [],
            'image/png': [],
        },
    });

    const sx = useMemo(
        () => ({
            ...baseStyle,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
            ...(file ? uploadedStyle : {}),
        }),
        [isFocused, isDragAccept, isDragReject, file],
    );

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Box
                {...getRootProps({
                    sx,
                })}
            >
                {file && (
                    <img
                        src={file.preview}
                        style={{
                            display: 'block',
                            width: 'auto',
                            maxHeight: '100%',
                            maxWidth: '100%',
                        }}
                        onLoad={() => {
                            URL.revokeObjectURL(file.preview);
                        }}
                    />
                )}
                <input {...getInputProps()} />
                {uploading && (
                    <Typography variant="caption">Uploading...</Typography>
                )}
                {!file && (
                    <>
                        <FileUpload />
                        <Typography variant="caption">
                            {isDragActive
                                ? 'Drop files here to upload.'
                                : 'Drag and drop a file or click to upload.'}
                        </Typography>
                    </>
                )}
                {!uploading && file && (
                    <Typography variant="body2" color="success">
                        File uploaded
                        <IconButton
                            size="small"
                            sx={{ ml: 0.5 }}
                            onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();

                                const res = await fetch(getFullUrl(`/media/pending/${value}`), { method: 'DELETE' });
                                if (!res.ok) {
                                    return alertError('Unable to remove file');
                                }
                                setFile(undefined);
                                setValue('');

                            }}
                        >
                            <Close />
                        </IconButton>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
