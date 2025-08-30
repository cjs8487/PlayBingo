import MDEditor from '@uiw/react-md-editor';
import { useField } from 'formik';

interface Props {
    name: string;
}

export function MarkdownField({ name }: Props) {
    const [field, , { setValue }] = useField<string>({ name });

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
