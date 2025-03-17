import { styled } from '@mui/material';
import { useField } from 'formik';
import { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { getFullUrl } from '../../lib/Utils';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

interface Props {
    name: string;
}

export default function FormikFileUpload({ name }: Props) {
    const [{ value, onChange }, _, { setValue }] = useField(name);

    const formRef = useRef<HTMLFormElement>(null);

    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
        onDrop: async (acceptedFiles) => {
            console.log(acceptedFiles);

            const formData = new FormData();
            formData.append('file', acceptedFiles[0]);
            const res = await fetch(getFullUrl('/media'), {
                method: 'POST',
                body: formData,
            });
        },
    });

    const files = acceptedFiles.map((file) => (
        <li key={file.path}>
            {file.path} - {file.size} bytes
        </li>
    ));

    return (
        <section className="container">
            <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <aside>
                <h4>Files</h4>
                <ul>{files}</ul>
            </aside>
        </section>
    );
}
