import { useField } from 'formik';
import { useJsonEditor } from '../../hooks/useJsonEditor';
import JsonEditor from '../JsonEditor';

export default function FormikJsonEditor({
    name,
    ...props
}: Omit<React.ComponentProps<typeof JsonEditor>, 'value' | 'onChange'> & {
    name: string;
}) {
    const [field, , helpers] = useField(name);

    const { error, handleChange } = useJsonEditor({
        initialValue: field.value ?? '',
    });

    return (
        <JsonEditor
            {...props}
            value={field.value}
            onChange={(value) => {
                handleChange(value);
                helpers.setValue(value);
            }}
            error={error}
        />
    );
}
