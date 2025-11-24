import Comment from '@/components/Comment';
import { useGoalManagerContext } from '@/context/GoalManagerContext';
import { ExpandMore, Send } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Avatar,
    IconButton,
    InputAdornment,
    Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
import { postCommentOnGoal } from '../../../../../../actions/Comments';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import { useUserContext } from '../../../../../../context/UserContext';
import { alertError, notifyMessage } from '../../../../../../lib/Utils';

export default function GoalComments() {
    const { selectedGoal, mutateGoals } = useGoalManagerContext();
    const { loggedIn, user } = useUserContext();

    if (!selectedGoal) {
        return null;
    }

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Comments</Typography>
            </AccordionSummary>
            <AccordionDetails
                sx={{
                    pt: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {loggedIn && user ? (
                    <Formik
                        initialValues={{ comment: '' }}
                        onSubmit={async ({ comment }) => {
                            const res = await postCommentOnGoal(
                                selectedGoal.id,
                                comment,
                            );

                            if (!res.ok) {
                                alertError('Failed to post comment');
                                return;
                            }
                            notifyMessage('Successfully posted comment');
                            mutateGoals();
                        }}
                    >
                        <Form>
                            <FormikTextField
                                name={'comment'}
                                label={''}
                                multiline
                                rows={4}
                                placeholder="Add a comment..."
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
                {selectedGoal.comments?.map((comment) => (
                    <Comment key={comment.id} comment={comment} />
                ))}
            </AccordionDetails>
        </Accordion>
    );
}
