import Comment from '@/components/Comment';
import { useGoalManagerContext } from '@/context/GoalManagerContext';
import { ExpandMore } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
} from '@mui/material';

export default function GoalComments() {
    const { selectedGoal } = useGoalManagerContext();

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
                <Comment />
                <Comment />
                <Comment />
            </AccordionDetails>
        </Accordion>
    );
}
