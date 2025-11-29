'use client';

import {
    createImageTag,
    deleteImageTag,
    updateImageTag,
} from '@/actions/ImageTags';
import FormikColorSelect from '@/components/input/FormikColorSelect';
import FormikTextField from '@/components/input/FormikTextField';
import { alertError } from '@/lib/Utils';
import { Check, Close, Delete } from '@mui/icons-material';
import { Box, Chip, IconButton } from '@mui/material';
import { GoalImageTag } from '@playbingo/types';
import { Form, Formik } from 'formik';

interface Props {
    slug: string;
    tag?: GoalImageTag;
    afterSubmit?: () => void;
}

export default function ImageTagForm({ slug, tag, afterSubmit }: Props) {
    return (
        <Formik
            initialValues={{
                label: tag?.label ?? '',
                color: tag?.color ?? '',
            }}
            onSubmit={async (values) => {
                let res;
                if (tag) {
                    res = await updateImageTag(slug, tag.id, values);
                } else {
                    res = await createImageTag(
                        slug,
                        values.label,
                        values.color,
                    );
                }
                if (!res.ok) {
                    alertError(`Unable to save tag - ${res.message}`);
                    return;
                }
                if (afterSubmit) {
                    afterSubmit();
                }
            }}
        >
            {({ values: { label, color } }) => (
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            mb: 1,
                        }}
                    >
                        <FormikTextField
                            name="label"
                            label="Label"
                            size="small"
                        />
                        <FormikColorSelect
                            name="color"
                            label="Background Color"
                            size="small"
                        />
                        <Box sx={{ display: 'flex', overflow: 'visible' }}>
                            <IconButton
                                type="submit"
                                size="small"
                                color="success"
                            >
                                <Check />
                            </IconButton>
                            <IconButton
                                type="button"
                                size="small"
                                color="error"
                                onClick={async () => {
                                    if (tag) {
                                        const res = await deleteImageTag(
                                            slug,
                                            tag.id,
                                        );
                                        if (!res.ok) {
                                            alertError(
                                                `Unable to delete tag - ${res.message}`,
                                            );
                                            return;
                                        }
                                    }
                                    if (afterSubmit) {
                                        afterSubmit();
                                    }
                                }}
                            >
                                {tag ? <Delete /> : <Close />}
                            </IconButton>
                        </Box>
                    </Box>
                    <Chip
                        label={label}
                        sx={{
                            backgroundColor: color,
                        }}
                    />
                </Form>
            )}
        </Formik>
    );
}
