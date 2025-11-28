'use client';

import { createImage, deleteImage, updateImage } from '@/actions/GoalImages';
import FormikFileUpload from '@/components/input/FileUpload';
import FormikTextField from '@/components/input/FormikTextField';
import { alertError } from '@/lib/Utils';
import { Check, Close, Delete } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { GoalImage } from '@playbingo/types';
import { Form, Formik } from 'formik';

interface Props {
    slug: string;
    image?: GoalImage;
    afterSubmit?: () => void;
}

export default function GoalImageForm({ slug, image, afterSubmit }: Props) {
    return (
        <Formik
            initialValues={{
                name: image?.name ?? '',
                image: image?.mediaFile ?? '',
            }}
            onSubmit={async (values) => {
                let res;
                if (image) {
                    res = await updateImage(slug, image.id, values);
                } else {
                    res = await createImage(slug, values.image, values.name);
                }
                if (!res.ok) {
                    alertError(`Unable to save image - ${res.message}`);
                    return;
                }
                if (afterSubmit) {
                    afterSubmit();
                }
            }}
        >
            <Box
                component={Form}
                sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                    }}
                >
                    <FormikFileUpload
                        name="image"
                        workflow="goalImage"
                        edit
                        shortMessage
                        disableRemove
                    />
                </Box>
                <FormikTextField name="name" label="Name" size="small" />
                <Box sx={{ display: 'flex' }}>
                    <IconButton type="submit" size="small" color="success">
                        <Check />
                    </IconButton>
                    <IconButton
                        type="button"
                        size="small"
                        color="error"
                        onClick={async () => {
                            if (image) {
                                const res = await deleteImage(slug, image.id);
                                if (!res.ok) {
                                    alertError(
                                        `Unable to delete goal image - ${res.message}`,
                                    );
                                    return;
                                }
                            }
                            if (afterSubmit) {
                                afterSubmit();
                            }
                        }}
                    >
                        {image ? <Delete /> : <Close />}
                    </IconButton>
                </Box>
            </Box>
        </Formik>
    );
}
