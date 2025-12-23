import NumberInput from '@/components/input/NumberInput';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    TextField,
    createFilterOptions,
} from '@mui/material';
import { Category, Goal, GoalTag } from '@playbingo/types';
import { Form, Formik, useField } from 'formik';
import { KeyedMutator } from 'swr';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import { useGoalManagerContext } from '../../../../../../context/GoalManagerContext';
import { alertError } from '../../../../../../lib/Utils';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const filter = createFilterOptions<{
    value: string;
    display: string;
}>();
interface CategorySelectProps {
    categories: Category[];
}

function CategorySelect({ categories }: CategorySelectProps) {
    const [field, , helpers] = useField<string[]>('categories');

    const catList = categories.map((c) => ({ value: c.name, display: c.name }));
    return (
        <Autocomplete
            multiple
            id="goal-cat-select"
            options={catList}
            value={field.value.map((v) => ({ value: v, display: v }))}
            onChange={(_, newValue) => {
                helpers.setValue(newValue.map((v) => v.value));
            }}
            disableCloseOnSelect
            getOptionLabel={(option) => option.display}
            renderOption={({ key, ...rest }, option, { selected }) => {
                return (
                    <li key={key} {...rest}>
                        <Checkbox
                            icon={icon}
                            checkedIcon={checkedIcon}
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {option.display}
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField {...params} label="Categories" />
            )}
            fullWidth
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some(
                    (option) => inputValue === option.value,
                );
                if (inputValue !== '' && !isExisting) {
                    filtered.push({
                        value: inputValue,
                        display: `Add "${inputValue}"`,
                    });
                }

                return filtered;
            }}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
        />
    );
}

interface TagSelectProps {
    tags: GoalTag[];
}

function TagSelect({ tags }: TagSelectProps) {
    const [field, , helpers] = useField<string[]>('tags');

    const tagList = tags.map((t) => ({ value: t.id, display: t.name }));
    console.log(tags);
    return (
        <Autocomplete
            multiple
            id="goal-tag-select"
            options={tagList}
            value={field.value.map((v) => ({
                value: v,
                display: tags.find((t) => t.id === v)?.name ?? v,
            }))}
            onChange={(_, newValue) => {
                helpers.setValue(newValue.map((v) => v.value));
            }}
            disableCloseOnSelect
            getOptionLabel={(option) => option.display}
            renderOption={({ key, ...rest }, option, { selected }) => {
                return (
                    <li key={key} {...rest}>
                        <Checkbox
                            icon={icon}
                            checkedIcon={checkedIcon}
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {option.display}
                    </li>
                );
            }}
            renderInput={(params) => <TextField {...params} label="Tags" />}
            fullWidth
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
        />
    );
}

interface GoalEditorProps {
    slug: string;
    goal: Goal;
    isNew?: boolean;
    cancelNew?: () => void;
    mutateGoals: KeyedMutator<Goal[]>;
    categories: Category[];
    canModerate?: boolean;
}

export default function GoalEditor({
    slug,
    goal,
    isNew,
    cancelNew,
    mutateGoals,
    categories,
    canModerate,
}: GoalEditorProps) {
    const { tags } = useGoalManagerContext();
    return (
        <Formik
            initialValues={{
                goal: goal.goal,
                description: goal.description ?? '',
                categories: goal.categories?.map((c) => c.name) ?? [],
                difficulty: goal.difficulty ?? 0,
                tags: goal.tags?.map((t) => t.id) ?? [],
            }}
            onSubmit={async ({
                goal: goalText,
                description,
                categories,
                difficulty,
                tags,
            }) => {
                if (isNew) {
                    const res = await fetch(`/api/games/${slug}/goals`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            goal: goalText,
                            description,
                            categories,
                            difficulty,
                        }),
                    });
                    if (!res.ok) {
                        const error = await res.text();
                        alertError(`Unable to create goal - ${error}`);
                        return;
                    }
                    mutateGoals();
                    if (cancelNew) {
                        cancelNew();
                    }
                } else {
                    const res = await fetch(`/api/goals/${goal.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            goal: goalText !== goal.goal ? goalText : undefined,
                            description:
                                description !== goal.description
                                    ? description
                                    : undefined,
                            categories:
                                categories.length !== goal.categories?.length ||
                                !categories.every((cat) =>
                                    goal.categories
                                        ?.map((cat) => cat.name)
                                        .includes(cat),
                                )
                                    ? categories
                                    : undefined,
                            difficulty:
                                difficulty !== goal.difficulty
                                    ? difficulty
                                    : undefined,
                            tags:
                                tags.length !== goal.tags?.length ||
                                !tags.every((tag) =>
                                    goal.tags
                                        ?.map((tag) => tag.id)
                                        .includes(tag),
                                )
                                    ? tags
                                    : undefined,
                        }),
                    });
                    if (!res.ok) {
                        const error = await res.text();
                        alertError(`Unable to update goal - ${error}`);
                        return;
                    }
                    mutateGoals();
                }
            }}
            enableReinitialize
        >
            {({ isSubmitting, isValidating, resetForm }) => (
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            rowGap: 3,
                            pt: 1,
                        }}
                    >
                        <FormikTextField
                            id="goal-name"
                            name="goal"
                            label="Goal Text"
                            disabled={!canModerate}
                            fullWidth
                        />
                        <FormikTextField
                            id="goal-description"
                            name="description"
                            label="Goal Description"
                            disabled={!canModerate}
                            multiline
                            rows={6}
                            fullWidth
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                columnGap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    flexGrow: 3,
                                }}
                            >
                                <CategorySelect categories={categories} />
                            </Box>
                            <Box
                                sx={{
                                    flexGrow: 3,
                                }}
                            >
                                <TagSelect tags={tags} />
                            </Box>
                            <Box
                                sx={{
                                    flexGrow: 1,
                                }}
                            >
                                <NumberInput
                                    id="goal-difficulty"
                                    name="difficulty"
                                    label="Difficulty"
                                    disabled={!canModerate}
                                    min={0}
                                    max={25}
                                />
                            </Box>
                        </Box>
                    </Box>
                    {canModerate && (
                        <Box
                            sx={{
                                display: 'flex',
                                pt: 1,
                            }}
                        >
                            <Button
                                type="button"
                                color="error"
                                onClick={() => {
                                    if (isNew && cancelNew) {
                                        cancelNew();
                                    }
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Box
                                sx={{
                                    flexGrow: 1,
                                }}
                            />
                            <Button
                                type="submit"
                                disabled={isSubmitting || isValidating}
                            >
                                Save
                            </Button>
                        </Box>
                    )}
                </Form>
            )}
        </Formik>
    );
}
