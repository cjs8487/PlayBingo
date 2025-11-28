'use client';

import { Box, Button } from '@mui/material';
import { useState } from 'react';
import GoalImageForm from './GoalImageForm';
import { Add } from '@mui/icons-material';

interface Props {
    slug: string;
}

export default function NewImage({ slug }: Props) {
    const [active, setIsActive] = useState(false);

    return (
        <Box>
            {active ? (
                <GoalImageForm
                    slug={slug}
                    afterSubmit={() => setIsActive(false)}
                />
            ) : (
                <Button onClick={() => setIsActive(true)} startIcon={<Add />}>
                    Add Image
                </Button>
            )}
        </Box>
    );
}
