'use client';

import { Add } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import ImageTagForm from './ImageTagForm';

interface Props {
    slug: string;
}

export default function NewTag({ slug }: Props) {
    const [active, setIsActive] = useState(false);

    return (
        <Box>
            {active ? (
                <ImageTagForm
                    slug={slug}
                    afterSubmit={() => setIsActive(false)}
                />
            ) : (
                <Button onClick={() => setIsActive(true)} startIcon={<Add />}>
                    Add Tag
                </Button>
            )}
        </Box>
    );
}
