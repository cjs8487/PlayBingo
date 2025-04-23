'use client';
import { createToken } from '../../../../actions/ApiTokens';
import { Form, Formik } from 'formik';
import { Box, Button } from '@mui/material';
import { object, string } from 'yup';
import FormikTextField from '../../../../components/input/FormikTextField';

const tokenValidationSchema = object().shape({
    name: string().required('Application name is required'),
});

export default function CreateTokenForm({
    existingValues,
}: {
    existingValues: string[];
}) {
    return (
        <Formik
            initialValues={{
                name: '',
            }}
            validationSchema={tokenValidationSchema}
            onSubmit={async ({ name }) => {
                const res = await createToken(name);
            }}
        >
            <Form>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center"
                    }}>
                    <FormikTextField
                        id="token-name"
                        type="text"
                        name="name"
                        label="Name"
                        validate={(value) => {
                            if (existingValues.includes(value)) {
                                return "Duplicate values aren't allowed";
                            }
                            return '';
                        }}
                    />
                    <Button type="submit">Create Token</Button>
                </Box>
            </Form>
        </Formik>
    );
}
