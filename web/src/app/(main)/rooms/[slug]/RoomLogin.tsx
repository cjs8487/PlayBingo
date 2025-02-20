'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { RoomContext } from '@/context/RoomContext';
import FormikTextField from '@/components/input/FormikTextField';
import FormikSwitch from '@/components/input/FormikSwitch';

export default function RoomLogin() {
    // context
    const { connect, roomData } = useContext(RoomContext);

    // state
    const [error, setError] = useState<string>();

    return (
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
                    <Typography pb={1} color="error" variant="body2">
                        {error}
                    </Typography>
                )}
                <Box display="flex" flexDirection="column" rowGap={2}>
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
                <Box display="flex">
                    <Box flexGrow={1} />
                    <Button type="submit">Join Room</Button>
                </Box>
            </Form>
        </Formik>
    );
}
