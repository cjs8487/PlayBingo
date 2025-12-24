import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    styled,
} from '@mui/material';
import { Goal } from '@playbingo/types';
import { forwardRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useGoalManagerContext } from '../../../../../../context/GoalManagerContext';

const ListItemHiddenSecondary = styled(ListItem)(() => ({
    '.MuiListItemSecondaryAction-root': {
        visibility: 'hidden',
    },
    '&.MuiListItem-root': {
        '&:hover .MuiListItemSecondaryAction-root': {
            visibility: 'inherit',
        },
    },
}));

function GoalListItemSecondary({ goal }: { goal: Goal }) {
    return (
        <>
            {goal.difficulty && (
                <Typography variant="body2" component="span">
                    Difficulty: {goal.difficulty}
                </Typography>
            )}
        </>
    );
}

export default function GoalList() {
    const {
        shownGoals,
        selectedGoal,
        setSelectedGoal,
        deleteGoal,
        settings: { showDetails },
        canModerate,
        setNewGoal,
    } = useGoalManagerContext();

    return (
        <Virtuoso<Goal>
            components={{
                // eslint-disable-next-line react/display-name
                List: forwardRef(({ style, children }, listRef) => {
                    return (
                        <List
                            style={{
                                padding: 0,
                                ...style,
                                margin: 0,
                            }}
                            component="div"
                            ref={listRef}
                        >
                            {children}
                        </List>
                    );
                }),
                Item: ({ children, ...props }) => {
                    return (
                        <ListItemHiddenSecondary
                            disableGutters
                            disablePadding
                            {...props}
                            style={{
                                margin: 0,
                                position: 'relative',
                            }}
                            secondaryAction={
                                canModerate ? (
                                    <IconButton
                                        aria-label="delete"
                                        onClick={(e) => {
                                            deleteGoal(props.item.id);
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                ) : null
                            }
                        >
                            {children}
                        </ListItemHiddenSecondary>
                    );
                },
                Footer: () =>
                    canModerate && (
                        <ListItem disableGutters disablePadding>
                            <ListItemButton
                                onClick={() => setNewGoal(true)}
                                alignItems="flex-start"
                            >
                                <ListItemIcon>
                                    <AddIcon color="success" />
                                </ListItemIcon>
                                <ListItemText>New Goal</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    ),
            }}
            data={shownGoals}
            style={{ height: '100%', width: '100%' }}
            itemContent={(index, goal) => (
                <>
                    <ListItemButton
                        onClick={() => setSelectedGoal(goal.id)}
                        selected={selectedGoal === goal}
                        divider
                    >
                        <Box>
                            <ListItemText
                                primary={goal.goal}
                                secondary={
                                    showDetails && (
                                        <GoalListItemSecondary goal={goal} />
                                    )
                                }
                            />
                            <Box>
                                {goal.categories?.map((cat) => (
                                    <Chip
                                        key={cat.id}
                                        label={cat.name}
                                        size="small"
                                        sx={{ mr: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </ListItemButton>
                </>
            )}
        />
    );
}
