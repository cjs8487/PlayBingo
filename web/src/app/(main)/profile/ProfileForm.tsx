'use client';

import { Box, Button } from '@mui/material';
import { Formik, Form } from 'formik';
import FormikTextField from '../../../components/input/FormikTextField';
import { User } from '../../../types/User';

interface Props {
    user: User;
}

export default function ProfileForm({ user }: Props) {
    return (
        <Formik
            initialValues={{ username: user.username, email: user.email }}
            onSubmit={() => {}}
        >
            <Form>
                <Box display="flex" flexDirection="column" rowGap={1}>
                    <FormikTextField
                        id="username"
                        name="username"
                        label="Username"
                        size="small"
                    />
                    <FormikTextField
                        id="email"
                        name="email"
                        label="Email"
                        size="small"
                    />
                    <Box display="flex">
                        <Box flexGrow={1} />
                        <Button className="rounded-md bg-green-700 px-2 py-1">
                            Update
                        </Button>
                    </Box>
                </Box>
            </Form>
        </Formik>
    );
}
