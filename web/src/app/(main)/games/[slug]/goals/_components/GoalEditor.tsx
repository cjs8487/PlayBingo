import NumberInput from '@/components/input/NumberInput';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    TextField,
    Typography,
    createFilterOptions,
} from '@mui/material';
import { Category, Goal } from '@playbingo/types';
import { Form, Formik, useField } from 'formik';
import Image from 'next/image';
import { KeyedMutator } from 'swr';
import { FormikSelectFieldAutocomplete } from '../../../../../../components/input/FormikSelectField';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import { useGoalManagerContext } from '../../../../../../context/GoalManagerContext';
import { alertError, getMediaForWorkflow } from '../../../../../../lib/Utils';

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
    const { images, imageTags } = useGoalManagerContext();

    return (
        <Formik
            initialValues={{
                goal: goal.goal,
                description: goal.description ?? '',
                categories: goal.categories?.map((c) => c.name) ?? [],
                difficulty: goal.difficulty ?? 0,
                image: goal.image?.id ?? '',
                secondaryImage: goal.secondaryImage?.id ?? '',
                imageTag: goal.imageTag?.id ?? '',
                count: goal.count ?? '',
            }}
            onSubmit={async ({
                goal: goalText,
                description,
                categories,
                difficulty,
                image,
                secondaryImage,
                imageTag,
                count,
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
                            image,
                            secondaryImage,
                            imageTag,
                            count,
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
                            image: image !== goal.image?.id ? image : undefined,
                            secondaryImage:
                                secondaryImage !== goal.secondaryImage?.id
                                    ? secondaryImage
                                    : undefined,
                            imageTag:
                                imageTag !== goal.imageTag?.id
                                    ? imageTag
                                    : undefined,
                            count: count !== goal.count ? count : undefined,
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
            {({
                isSubmitting,
                isValidating,
                resetForm,
                values: { image, secondaryImage, imageTag, count },
            }) => (
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
                    <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '250px',
                                height: '250px',
                                border: 1,
                                borderColor: 'divider',
                                backgroundColor: 'background.default',
                            }}
                        >
                            {image && (
                                <Image
                                    src={getMediaForWorkflow(
                                        'goalImage',
                                        images.filter((i) => i.id === image)[0]
                                            .mediaFile,
                                    )}
                                    alt=""
                                    width={250}
                                    height={250}
                                    style={{
                                        objectFit: 'contain',
                                    }}
                                />
                            )}
                            {secondaryImage && (
                                <Image
                                    src={getMediaForWorkflow(
                                        'goalImage',
                                        images.filter(
                                            (i) => i.id === secondaryImage,
                                        )[0].mediaFile,
                                    )}
                                    alt=""
                                    width={25}
                                    height={25}
                                    style={{
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '8px',
                                        left: '8px',
                                    }}
                                />
                            )}
                            {imageTag && (
                                <Chip
                                    label={
                                        imageTags.filter(
                                            (i) => i.id === imageTag,
                                        )[0].label
                                    }
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        mt: 0.5,
                                        mr: 0.5,
                                        backgroundColor: imageTags.filter(
                                            (i) => i.id === imageTag,
                                        )[0].color,
                                    }}
                                />
                            )}
                            {count && (
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        pr: 1,
                                        filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                                        textShadow: '2px 2px black',
                                    }}
                                    fontSize={18}
                                >
                                    {count}
                                </Typography>
                            )}
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}
                        >
                            <FormikSelectFieldAutocomplete
                                id="goal-image-primary"
                                name="image"
                                label="Primary Image"
                                options={images.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                            <FormikSelectFieldAutocomplete
                                id="goal-image-secondary"
                                name="secondaryImage"
                                label="Secondary Image"
                                options={images.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                            <FormikSelectFieldAutocomplete
                                id="goal-image-tag"
                                name="imageTag"
                                label="Image Tag"
                                options={imageTags.map((i) => ({
                                    value: i.id,
                                    label: i.label,
                                }))}
                            />
                            <NumberInput name="count" label="Count" />
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
