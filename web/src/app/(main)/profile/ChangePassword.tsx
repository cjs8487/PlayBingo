'use client';

import {
    Button,
    Box,
    Typography,
    DialogContent,
    DialogTitle,
    DialogActions,
    IconButton,
    Alert,
} from '@mui/material';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useUserContext } from '../../../context/UserContext';
import { Form, Formik } from 'formik';
import { forwardRef, RefObject, useRef, useState } from 'react';
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
                        <Alert severity="warning">
                            Changing your password will end all of your login
                            sessions, including this one. You will need to log
                            in again after the password change.
                        </Alert>
                        <PasswordForm ref={formRef} dialogRef={dialogRef} />
                    </Box>
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
            /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:;<>,.?/~_+\-=|]).{8,}$/,
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
    dialogRef: RefObject<DialogRef | null>;
}

const PasswordForm = forwardRef<HTMLFormElement, FormProps>(
    function PasswordForm({ dialogRef }, ref) {
        const { user, checkSession } = useUserContext();

        const [message, setMessage] = useState('');
        const [showCurrentPassword, setShowCurrentPassword] = useState(false);
        const [showNewPassword, setShowNewPassword] = useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                    dialogRef.current?.close();
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
                            type={showCurrentPassword ? 'text' : 'password'}
                            endAdornment={
                                <IconButton
                                    onClick={() =>
                                        setShowCurrentPassword((curr) => !curr)
                                    }
                                    edge="end"
                                    size="small"
                                >
                                    {showCurrentPassword ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            }
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
                                type={showNewPassword ? 'text' : 'password'}
                                endAdornment={
                                    <IconButton
                                        onClick={() =>
                                            setShowNewPassword((curr) => !curr)
                                        }
                                        edge="end"
                                        size="small"
                                    >
                                        {showNewPassword ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                }
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
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {newPassword.length >= 8 ? (
                                            <Check sx={{ fontSize: 16 }} />
                                        ) : (
                                            <Close sx={{ fontSize: 16 }} />
                                        )}
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
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {newPassword.match(/[a-z]+/) ? (
                                            <Check sx={{ fontSize: 16 }} />
                                        ) : (
                                            <Close sx={{ fontSize: 16 }} />
                                        )}
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
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {newPassword.match(/[A-Z]+/) ? (
                                            <Check sx={{ fontSize: 16 }} />
                                        ) : (
                                            <Close sx={{ fontSize: 16 }} />
                                        )}
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
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {newPassword.match(/[0-9]+/) ? (
                                            <Check sx={{ fontSize: 16 }} />
                                        ) : (
                                            <Close sx={{ fontSize: 16 }} />
                                        )}
                                        A number
                                    </Typography>
                                    <Typography
                                        component="li"
                                        variant="caption"
                                        color={
                                            newPassword.match(
                                                /[*.!@$%^&(){}[\]:;<>,.?/~_+\-=|\\]+/,
                                            )
                                                ? 'success.main'
                                                : ''
                                        }
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {newPassword.match(
                                            /[*.!@$%^&(){}[\]:;<>,.?/~_+\-=|\\]+/,
                                        ) ? (
                                            <Check sx={{ fontSize: 16 }} />
                                        ) : (
                                            <Close sx={{ fontSize: 16 }} />
                                        )}
                                        A symbol
                                    </Typography>
                                </ul>
                            </Typography>
                        </Box>
                        <FormikTextField
                            name="confirmNewPassword"
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            endAdornment={
                                <IconButton
                                    onClick={() =>
                                        setShowConfirmPassword((curr) => !curr)
                                    }
                                    edge="end"
                                    size="small"
                                >
                                    {showConfirmPassword ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            }
                        />
                    </Form>
                )}
            </Formik>
        );
    },
);
