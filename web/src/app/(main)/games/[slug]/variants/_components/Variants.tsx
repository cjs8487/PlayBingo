'use client';
import {
    Button,
    Dialog,
    DialogContent,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { GoalCategory, Variant } from '@playbingo/types';
import { useState } from 'react';
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
            <List>
                <ListItem sx={{ display: 'flex', gap: 4 }}>
                    <Typography>Normal</Typography>
                    <Typography>
                        The base form of the game. Typically this includes most,
                        if not all, of the goals in the game and doesn&apos;t
                        have any special generation rules.
                    </Typography>
                </ListItem>
                {variants.map((variant) => (
                    <ListItem key={variant.id}>{variant.name}</ListItem>
                ))}
                {moderator && (
                    <ListItem
                        component={Button}
                        onClick={() => setShowModal(true)}
                    >
                        Add New Variant
                    </ListItem>
                )}
            </List>
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Variants"
            >
                <DialogContent>
                    <VariantForm slug={slug} categories={categories} />
                </DialogContent>
            </Dialog>
        </>
    );
}
