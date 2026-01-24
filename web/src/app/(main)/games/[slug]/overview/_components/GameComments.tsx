'use client';

import Comment from '@/components/Comment';
import { useUserContext } from '@/context/UserContext';
import { Send } from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    IconButton,
    InputAdornment,
    Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
import type { Comment as CommentType } from '@playbingo/types';
import { postCommentOnGame } from '../../../../../../actions/Comments';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import { alertError, notifyMessage } from '../../../../../../lib/Utils';

interface Props {
    gameSlug: string;
    comments: CommentType[];
}

export default function GameComments({ gameSlug, comments }: Props) {
    const { loggedIn, user } = useUserContext();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            <Typography variant="h6">Comments</Typography>
            {loggedIn && user ? (
                <Formik
                    initialValues={{ comment: '' }}
                    onSubmit={async ({ comment }, { resetForm }) => {
                        const res = await postCommentOnGame(gameSlug, comment);

                        if (!res.ok) {
                            alertError('Failed to post comment');
                            return;
                        }
                        notifyMessage('Successfully posted comment');
                        resetForm();
                    }}
                >
                    <Form>
                        <FormikTextField
                            name={'comment'}
                            label={''}
                            multiline
                            rows={4}
                            placeholder="Add a comment about this game..."
                            fullWidth
                            startAdornment={
                                <InputAdornment
                                    position="start"
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    <Avatar
                                        src={user?.avatar ?? '/'}
                                        alt={user?.username}
                                        sx={{ width: 32, height: 32 }}
                                    />
                                </InputAdornment>
                            }
                            endAdornment={
                                <InputAdornment
                                    position="end"
                                    sx={{ alignSelf: 'flex-end' }}
                                >
                                    <IconButton type="submit">
                                        <Send />
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </Form>
                </Formik>
            ) : (
                <Alert severity="info" variant="filled">
                    Log in to leave comments and join the discussion
                </Alert>
            )}
            {comments?.map((comment) => (
                <Comment key={comment.id} comment={comment} />
            ))}
        </Box>
    );
}
