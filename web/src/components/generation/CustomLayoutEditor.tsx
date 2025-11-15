import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { GeneratorSettings } from '@playbingo/shared';
import { useCallback, useState } from 'react';
import {
    JSONSchema,
    JsonSchemaRenderer,
    JsonSchemaRendererProps,
} from '../input/JsonSchemaRenderer';
import NumberField from '../NumberField';

export type CustomLayout = Extract<
    GeneratorSettings['boardLayout'],
    { mode: 'custom' }
>['layout'];

export type Schema = {
    items: {
        items: {
            anyOf: JSONSchema[];
        } & JSONSchema;
    } & JSONSchema;
} & JSONSchema;

interface Props extends JsonSchemaRendererProps {
    value: CustomLayout;
    schema: Schema;
}

export default function CustomLayoutEditor({
    schema,
    value,
    onChange,
    errors,
    path,
    components,
}: Props) {
    const [width, setWidth] = useState(value[0]?.length ?? 5);
    const [height, setHeight] = useState(value?.length ?? 5);
    const [showModal, setShowModal] = useState(false);
    const [modalRow, setModalRow] = useState(0);
    const [modalCol, setModalCol] = useState(0);

    const doSetWidth = (val: number) => {
        if (val <= 0) {
            return;
        }

        let newVal = value.map((row) => [...row.map((cell) => ({ ...cell }))]);
        if (val < width) {
            newVal = newVal.map((row) => {
                row.splice(val, row.length);
                return row;
            });
        } else if (val > width) {
            newVal = newVal.map((row) => {
                row.push(
                    ...Array(val - width).fill(schema.items.items.default),
                );
                return row;
            });
        }
        setWidth(val);
        onChange(newVal);
    };

    const doSetHeight = (val: number) => {
        if (val <= 0) {
            return;
        }

        const newVal = value.map((row) => [
            ...row.map((cell) => ({ ...cell })),
        ]);
        if (val < height) {
            newVal.splice(val, newVal.length);
        } else if (val > height) {
            newVal.push(
                ...Array(val - height).fill(
                    Array(width).fill(schema.items.items.default),
                ),
            );
        }
        setHeight(val);
        onChange(newVal);
    };

    const openModal = useCallback((row: number, col: number) => {
        setShowModal(true);
        setModalRow(row);
        setModalCol(col);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setModalRow(0);
        setModalCol(0);
    }, []);

    const getCriteriaType = (
        criteria: CustomLayout[number][number]['selectionCriteria'],
    ) =>
        schema.items.items.anyOf.filter(
            (opt) => opt.properties!['selectionCriteria'].const === criteria,
        )[0];

    return (
        <>
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                <NumberField
                    label="Width"
                    value={width ?? ''}
                    error={!!errors[`${path}.0`]}
                    helperText={errors[`${path}.0`] ?? ' '}
                    onChange={(v) => doSetWidth(v ?? 1)}
                    sx={{ width: '100%' }}
                />
                <NumberField
                    label="Height"
                    value={height ?? ''}
                    error={!!errors[path]}
                    helperText={errors[path] ?? ' '}
                    onChange={(v) => doSetHeight(v ?? 1)}
                    sx={{ width: '100%' }}
                />
            </Box>
            <Box
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    display: 'grid',
                    gridTemplateRows: `repeat(${value.length}, 1fr)`,
                    gridTemplateColumns: `repeat(${value[0]?.length}, 1fr)`,
                }}
            >
                {value.map((row, rowIndex) => (
                    <Box
                        key={rowIndex}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'subgrid',
                            gridColumn: '1 / -1',
                        }}
                    >
                        {row.map((cell, colIndex) => {
                            const criteriaType = getCriteriaType(
                                cell.selectionCriteria,
                            );
                            return (
                                <Box
                                    key={colIndex}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        p: 2,
                                        cursor: 'pointer',
                                        transition: 'all',
                                        transitionDuration: 300,
                                        textAlign: 'center',
                                        background: (theme) =>
                                            theme.palette.background.default,
                                        ':hover': {
                                            zIndex: 10,
                                            scale: '110%',
                                        },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.5,
                                    }}
                                    onClick={() =>
                                        openModal(rowIndex, colIndex)
                                    }
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {criteriaType.title}
                                    </Typography>
                                    {Object.entries(cell)
                                        .filter(
                                            ([key]) =>
                                                key !== 'selectionCriteria',
                                        )
                                        .map(([key, value]) =>
                                            criteriaType.properties?.[key]
                                                ?.enum ? (
                                                <Typography key={key}>
                                                    {criteriaType.properties?.[
                                                        key
                                                    ]?.enumMeta?.[value]
                                                        ?.label ?? ''}
                                                </Typography>
                                            ) : (
                                                <Typography key={key}>
                                                    {value}
                                                </Typography>
                                            ),
                                        )}
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
            <Dialog open={showModal} onClose={closeModal}>
                <DialogTitle>
                    Editing ({modalRow}, {modalCol})
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <JsonSchemaRenderer
                            schema={schema.items.items}
                            value={value[modalRow][modalCol]}
                            onChange={(val) => {
                                const next = value.map((row) => row.slice());
                                next[modalRow][modalCol] =
                                    val as CustomLayout[number][number];
                                onChange(next);
                            }}
                            errors={errors}
                            path={`${path}.${modalRow}.${modalCol}`}
                            components={components}
                        />
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}
