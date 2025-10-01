'use client';
import { Delete, Settings } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    IconButton,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { GoalCategory, Variant } from '@playbingo/types';
import { useState } from 'react';
import VariantForm from './VariantForm';
import { alertError, notifyMessage } from '../../../../../../lib/Utils';
import { useConfirm } from 'material-ui-confirm';
import { deleteVariant } from '../../../../../../actions/Variants';

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
    const [editVariant, setEditVariant] = useState<Variant | undefined>();
    const confirm = useConfirm();

    const closeModal = () => {
        setShowModal(false);
        setEditVariant(undefined);
    };

    return (
        <>
            <List
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
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
                        <IconButton
                            onClick={() => {
                                setShowModal(true);
                                setEditVariant(variant);
                            }}
                        >
                            <Settings />
                        </IconButton>
                        {moderator && (
                            <IconButton
                                color="error"
                                onClick={async () => {
                                    const { confirmed } = await confirm({
                                        title: `Delete ${variant.name}`,
                                        confirmationText: 'Delete',
                                        confirmationButtonProps: {
                                            color: 'error',
                                        },
                                        cancellationText: 'Cancel',
                                        description: `Are you sure you want to delete the variant "${variant.name}"? This action cannot be undone.`,
                                    });

                                    if (!confirmed) {
                                        return;
                                    }

                                    const res = await deleteVariant(
                                        slug,
                                        variant.id,
                                    );
                                    if (!res.ok) {
                                        alertError('Unable to delete variant.');
                                        return;
                                    }
                                    notifyMessage('Variant deleted.');
                                }}
                            >
                                <Delete />
                            </IconButton>
                        )}
                    </ListItem>
                ))}
                {moderator && (
                    <Box
                        sx={{ gridColumn: '1 / -1' }}
                        component={Button}
                        onClick={() => {
                            setEditVariant(undefined);
                            setShowModal(true);
                        }}
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
                {editVariant ? (
                    <VariantForm
                        slug={slug}
                        categories={categories}
                        editVariant={editVariant}
                        closeModal={closeModal}
                    />
                ) : (
                    <VariantForm
                        slug={slug}
                        categories={categories}
                        closeModal={closeModal}
                        isNew
                    />
                )}
            </Dialog>
        </>
    );
}
