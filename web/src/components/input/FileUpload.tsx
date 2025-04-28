'use client';

import { useField } from 'formik';
import { useDropzone } from 'react-dropzone';
import {
    alertError,
    getFullUrl,
    getMediaForWorkflow,
    MediaWorkflow,
} from '../../lib/Utils';
import { Box, IconButton, Theme, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FileUpload from '@mui/icons-material/FileUpload';
import Close from '@mui/icons-material/Close';

const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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

interface BaseProps {
    name: string;
    workflow: MediaWorkflow;
    edit?: boolean;
}

interface CircleProps extends BaseProps {
    circle: true;
    size: string | number;
}

interface NormalProps extends BaseProps {
    circle: false;
    size: never;
}

type Props = NormalProps | CircleProps;

export default function FormikFileUpload({
    name,
    workflow,
    edit,
    circle,
    size,
}: Props) {
    const [{ value }, _meta, { setValue }] = useField<string>(name);
    const [file, setFile] = useState<{ preview: string }>();
    const [uploading, setUploading] = useState(false);
    const [changed, setChanged] = useState(false);

    useEffect(() => {
        if (value) {
            setFile({ preview: getMediaForWorkflow(workflow, value) });
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
            if (acceptedFiles.length === 0) {
                return;
            }
            setUploading(true);
            const formData = new FormData();
            formData.append('file', acceptedFiles[0]);
            formData.append('workflow', workflow);
            const res = await fetch(getFullUrl('/media'), {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                alertError(`Unable to upload file - ${await res.text()}`);
                setUploading(false);
                return;
            }

            const { id } = await res.json();
            setValue(id);
            setFile({ preview: URL.createObjectURL(acceptedFiles[0]) });
            setUploading(false);
            setChanged(true);
        },
        maxFiles: 1,
        accept: {
            'image/jpeg': [],
            'image/png': [],
        },
        maxSize: 1024 * 1024,
    });

    const borderRadius = circle ? '50%' : 2;
    const aspectRatio = circle ? '1:1' : 'auto';
    const padding = circle ? 0 : 2;

    const sx = useMemo(
        () => ({
            ...baseStyle,
            borderRadius,
            aspectRatio,
            padding,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
            ...(file ? uploadedStyle : {}),
        }),
        [isFocused, isDragAccept, isDragReject, file],
    );

    const imgWidth = circle ? size : '100%';
    const imgHeight = circle ? size : '100%';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
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
                            width: imgWidth,
                            maxWidth: '100%',
                            height: imgHeight,
                            maxHeight: '100%',
                            borderRadius,
                            objectFit: 'cover',
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
            </Box>
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
    );
}
