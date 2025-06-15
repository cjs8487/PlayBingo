'use client';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { RoomContext } from '../../context/RoomContext';
import FormikTextField from '../input/FormikTextField';
import FormikSwitch from '../input/FormikSwitch';

export default function RoomLogin() {
    // context
    const { connect, roomData } = useContext(RoomContext);

    // state
    const [error, setError] = useState<string>();

    return (
        <Box
            sx={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Formik
                initialValues={{
                    nickname: '',
                    password: '',
                    spectator: false,
                }}
                onSubmit={async ({ nickname, password, spectator }) => {
                    const result = await connect(nickname, password, spectator);
                    if (!result.success) {
                        setError(result.message);
                    }
                }}
            >
                <Form>
                    {error && (
                        <Typography
                            color="error"
                            variant="body2"
                            sx={{
                                pb: 1,
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 2,
                        }}
                    >
                        <FormikTextField
                            id="nickname"
                            name="nickname"
                            label="Nickname"
                        />
                        <FormikTextField
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                        />
                        <FormikSwitch
                            name="spectator"
                            id="spectator"
                            label="Join as spectator?"
                        />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                        }}
                    >
                        <Box
                            sx={{
                                flexGrow: 1,
                            }}
                        />
                        <Button type="submit">Join Room</Button>
                    </Box>
                </Form>
            </Formik>
        </Box>
    );
}
