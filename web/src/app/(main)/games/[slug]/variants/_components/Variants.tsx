'use client';
import { Button, Dialog, Box, List, ListItem, Typography } from '@mui/material';
import { GoalCategory, Variant } from '@playbingo/types';
import { Fragment, useState } from 'react';
import VariantForm from './VariantForm';

interface Props {
    variants: Variant[];
    moderator?: boolean;
    slug: string;
    categories: GoalCategory[];
}

export default function Variants({
    variants,
    moderator,
    slug,
    categories,
}: Props) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <List
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gridAutoFlow: 'row',
                    gap: 2,
                }}
            >
                <ListItem
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'subgrid',
                        gridColumn: '1 / -1',
                    }}
                >
                    <Typography>Normal</Typography>
                    <Typography>
                        The base form of the game. Typically this includes most,
                        if not all, of the goals in the game and doesn&apos;t
                        have any special generation rules.
                    </Typography>
                </ListItem>
                {variants.map((variant) => (
                    <ListItem
                        key={variant.id}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'subgrid',
                            gridColumn: '1 / -1',
                        }}
                    >
                        <Typography>{variant.name}</Typography>
                        <Typography>{variant.description}</Typography>
                    </ListItem>
                ))}
                {moderator && (
                    <Box
                        sx={{ gridColumn: '1 / -1' }}
                        component={Button}
                        onClick={() => setShowModal(true)}
                    >
                        Add New Variant
                    </Box>
                )}
            </List>
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Variants"
            >
                <VariantForm slug={slug} categories={categories} />
            </Dialog>
        </>
    );
}
