'use client';

import { useField } from 'formik';
import { useDropzone } from 'react-dropzone';
import { alertError, gameCoverUrl, getFullUrl } from '../../lib/Utils';
import { Box, IconButton, Theme, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FileUpload from '@mui/icons-material/FileUpload';
import Close from '@mui/icons-material/Close';

const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 2,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: 'divider',
    borderStyle: 'dashed',
    color: (theme: Theme) => theme.palette.text.secondary,
    outline: 'none',
    transition: 'border .24s ease-in-out',
    cursor: 'pointer',
    ':hover': {
        backgroundColor: (theme: Theme) => theme.palette.action.hover,
        borderColor: (theme: Theme) => theme.palette.action.focus,
    },
    width: '100%',
    height: '100%',
};

const focusedStyle = {
    borderColor: (theme: Theme) => theme.palette.primary.main,
};

const acceptStyle = {
    borderColor: (theme: Theme) => theme.palette.success.main,
};

const rejectStyle = {
    borderColor: '#ff1744',
};

const uploadedStyle = {
    border: 'none',
    padding: 0,
};

interface Props {
    name: string;
    workflow: string;
    edit?: boolean;
}

export default function FormikFileUpload({ name, workflow, edit }: Props) {
    const [{ value }, _meta, { setValue }] = useField<string>(name);
    const [file, setFile] = useState<{ preview: string }>();
    const [uploading, setUploading] = useState(false);
    const [changed, setChanged] = useState(false);

    console.log(value);
    useEffect(() => {
        if (value) {
            setFile({ preview: gameCoverUrl(value) });
        }
    }, []);

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
            setChanged(true);
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
                {changed && !uploading && file && (
                    <Typography variant="body2" color="success">
                        File uploaded
                        <IconButton
                            size="small"
                            sx={{ ml: 0.5 }}
                            onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();

                                const res = await fetch(
                                    getFullUrl(`/media/pending/${value}`),
                                    { method: 'DELETE' },
                                );
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
                {edit && !changed && file && (
                    <IconButton
                        size="small"
                        sx={{ ml: 0.5 }}
                        onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setFile(undefined);
                            setValue('');
                        }}
                    >
                        <Close />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}
