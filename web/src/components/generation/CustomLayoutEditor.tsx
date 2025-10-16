import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { GeneratorSettings } from '@playbingo/shared';
import { useCallback, useState } from 'react';
import {
    JSONSchema,
    JsonSchemaRenderer,
    JsonSchemaRendererProps,
} from '../input/JsonSchemaRenderer';

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
    console.log(schema);
    const [width, setWidth] = useState(value[0].length);
    const [height, setHeight] = useState(value.length);
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
                row.pop();
                return row;
            });
        } else if (val > width) {
            newVal = newVal.map((row) => {
                row.push({ selectionCriteria: 'random' });
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
            newVal.pop();
        } else if (val > height) {
            newVal.push(Array(width).fill({ selectionCriteria: 'random' }));
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
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    type="number"
                    label="Width"
                    value={(width as number) ?? ''}
                    error={!!errors[path]}
                    helperText={errors[path] ?? ' '}
                    onChange={(e) =>
                        doSetWidth(
                            e.target.value === '' ? 1 : Number(e.target.value),
                        )
                    }
                    sx={{ width: '100%' }}
                />
                <TextField
                    type="number"
                    label="Height"
                    value={(height as number) ?? ''}
                    error={!!errors[path]}
                    helperText={errors[path] ?? ' '}
                    onChange={(e) =>
                        doSetHeight(
                            e.target.value === '' ? 1 : Number(e.target.value),
                        )
                    }
                    sx={{ width: '100%' }}
                />
            </Box>
            <Box
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    display: 'grid',
                    gridTemplateRows: `repeat(${value.length}, 1fr)`,
                    gridTemplateColumns: `repeat(${value[0].length}, 1fr)`,
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
