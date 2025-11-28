'use client';

import FormikFileUpload from '@/components/input/FileUpload';
import FormikTextField from '@/components/input/FormikTextField';
import { Check } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { GoalImage } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { createImage, updateImage } from '@/actions/GoalImages';
import { alertError } from '@/lib/Utils';

interface BaseProps {
    slug: string;
}
interface EditProps extends BaseProps {
    image: GoalImage;
}

interface NewProps extends BaseProps {
    image?: never;
}

type Props = NewProps | EditProps;

export default function GoalImageForm({ slug, image }: Props) {
    console.log(image);
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
                <IconButton type="submit" size="small" color="success">
                    <Check />
                </IconButton>
            </Box>
        </Formik>
    );
}
