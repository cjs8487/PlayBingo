'use client';

import {
    Button,
    Box,
    Typography,
    DialogContent,
    DialogTitle,
    DialogActions,
} from '@mui/material';
import { useUserContext } from '../../../context/UserContext';
import { Form, Formik } from 'formik';
import { forwardRef, useRef, useState } from 'react';
import Dialog, { DialogRef } from '../../../components/Dialog';
import FormikTextField from '../../../components/input/FormikTextField';
import { object, string } from 'yup';
import { changePassword } from '../../../actions/User';

export default function ChangePassword() {
    const dialogRef = useRef<DialogRef>(null);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <>
            <Button
                color="error"
                variant="outlined"
                onClick={() => dialogRef.current?.open()}
            >
                Change Password
            </Button>
            <Dialog ref={dialogRef}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 0.75, pb: 1 }}>
                        <PasswordForm
                            ref={formRef}
                            dialogRef={dialogRef.current}
                        />
                    </Box>
                    <Typography
                        variant="caption"
                        color="warning"
                        lineHeight={0}
                    >
                        Changing your password will end all of your login
                        sessions, including this one. You will need to log in
                        again after the password change.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        color="error"
                        onClick={() => dialogRef.current?.close()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => formRef.current?.requestSubmit()}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

const validationSchema = object({
    currentPassword: string().required('Current Password is required.'),
    newPassword: string()
        .required('New Password is required.')
        .matches(
            /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}\[\]:;<>,.?\/~_+-=|]).{8,}$/,
            'New password does not meet strength requirements.',
        ),
    confirmNewPassword: string()
        .required('Confirm your new password.')
        .test(
            'matches',
            'Passwords do not match.',
            (confirm, ctx) =>
                ctx.parent.newPassword && confirm === ctx.parent.newPassword,
        ),
});

interface FormProps {
    dialogRef: DialogRef | null;
}

const PasswordForm = forwardRef<HTMLFormElement, FormProps>(
    function PasswordForm({ dialogRef }, ref) {
        const { user, checkSession } = useUserContext();

        const [message, setMessage] = useState('');

        if (!user) {
            return null;
        }

        return (
            <Formik
                initialValues={{
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                }}
                onSubmit={async ({ currentPassword, newPassword }) => {
                    const res = await changePassword(
                        user?.id,
                        currentPassword,
                        newPassword,
                    );

                    if (!res.ok) {
                        setMessage(res.message);
                        return;
                    }
                    checkSession();
                    dialogRef?.close();
                }}
                validationSchema={validationSchema}
            >
                {({ values: { newPassword } }) => (
                    <Form
                        ref={ref}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 12,
                        }}
                    >
                        <Typography color="error">{message}</Typography>
                        <FormikTextField
                            name="currentPassword"
                            label="Current Password"
                            autoComplete="password"
                            type="password"
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 1,
                            }}
                        >
                            <FormikTextField
                                name="newPassword"
                                label="New Password"
                                type="password"
                            />
                            <Typography variant="caption">
                                Your new password must contain the following:
                                <ul style={{ margin: 0 }}>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.length >= 8
                                                ? 'success.main'
                                                : ''
                                        }
                                    >
                                        At least 8 characters
                                    </Typography>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.match(/[a-z]+/)
                                                ? 'success.main'
                                                : ''
                                        }
                                    >
                                        One lowercase letter
                                    </Typography>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.match(/[A-Z]+/)
                                                ? 'success.main'
                                                : ''
                                        }
                                    >
                                        One uppercase letter
                                    </Typography>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.match(/[0-9]+/)
                                                ? 'success.main'
                                                : ''
                                        }
                                    >
                                        A number
                                    </Typography>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.match(
                                                /[*.!@$%^&(){}\[\]:;<>,.?\/~_\+\-=|\\]+/,
                                            )
                                                ? 'success.main'
                                                : ''
                                        }
                                    >
                                        A symbol
                                    </Typography>
                                </ul>
                            </Typography>
                        </Box>
                        <FormikTextField
                            name="confirmNewPassword"
                            label="Confirm New Password"
                            type="password"
                        />
                    </Form>
                )}
            </Formik>
        );
    },
);
