'use client';
import { Box } from '@mui/material';
import FormikFileUpload from '@/components/input/FileUpload';
import { Form, Formik } from 'formik';
import FormikTextField from '../../../../../components/input/FormikTextField';

export default function ImagesPage() {
    return (
        <>
            <Formik initialValues={{}} onSubmit={() => {}}>
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
                        />
                    </Box>
                    <FormikTextField name="name" label="Name" size="small" />
                </Box>
            </Formik>
        </>
    );
}
