'use client';

import { Box, Button } from '@mui/material';
import { Formik, Form } from 'formik';
import FormikTextField from '../../../components/input/FormikTextField';
import { object, string } from 'yup';
import {
    emailAvailable,
    usernameAvailable,
} from '../../../actions/Registration';
import { updateProfile } from '../../../actions/User';
import { alertError } from '../../../lib/Utils';
import { useUserContext } from '../../../context/UserContext';
import FormikFileUpload from '../../../components/input/FileUpload';

const validationSchema = object({
    email: string()
        .required('Email is required.')
        .email('Not a properly formatted email.')
        .test(
            'isAvailable',
            'An account is already registered with that email.',
            emailAvailable,
        ),
    username: string()
        .required('Username is required.')
        .min(4, 'Username must be at least 4 characters.')
        .max(16, 'Username cannot be longer than 16 characters.')
        .matches(
            /^[a-zA-Z0-9]*$/,
            'Username can only contain letters and numbers.',
        )
        .test(
            'isAvailable',
            'An account with that username already exists.',
            usernameAvailable,
        ),
});

export default function ProfileForm() {
    const { user, checkSession } = useUserContext();

    if (!user) {
        return null;
    }

    return (
        <Formik
            initialValues={{
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            }}
            onSubmit={async (values) => {
                const res = await updateProfile(user.id, {
                    ...values,
                    shouldRemoveAvatar: !!user.avatar && !values.avatar,
                });
                if (!res.ok) {
                    alertError(`Unable to save changes - ${res.message}`);
                    return;
                }
                checkSession();
            }}
        >
            <Form>
                <Box
                    sx={{
                        display: 'grid',
                        width: '100%',
                        gridTemplateColumns: 'repeat(5, 20.5%)',
                        gridTemplateRows: 'repeat(5, 1fr)',
                        rowGap: 2,
                        columnGap: 1,
                    }}
                >
                    <Box
                        sx={{
                            gridRow: '1/-1',
                            aspectRatio: '1/1',
                        }}
                    >
                        <FormikFileUpload
                            name="avatar"
                            workflow="userAvatar"
                            circle
                            edit
                        />
                    </Box>

                    <FormikTextField
                        id="username"
                        name="username"
                        label="Username"
                        size="small"
                        sx={{
                            gridColumn: '2 / -1',
                        }}
                    />
                    <FormikTextField
                        id="email"
                        name="email"
                        label="Email"
                        size="small"
                        sx={{
                            gridColumn: '2 / -1',
                        }}
                    />
                    <Button
                        type="submit"
                        sx={{
                            gridColumn: '2/-1',
                            justifySelf: 'end',
                        }}
                    >
                        Update
                    </Button>
                </Box>
            </Form>
        </Formik>
    );
}
