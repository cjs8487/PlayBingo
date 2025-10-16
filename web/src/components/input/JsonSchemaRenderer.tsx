import { Add, Delete } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import z, { ZodType } from 'zod';
import NumberField from '../NumberField';

type Errors = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useJSONForm<T extends ZodType<any, any>>(
    schema: T,
    initialValues: z.infer<T>,
) {
    const [values, setValues] = useState<JSONValue>(initialValues);
    const [errors, setErrors] = useState<Errors>({});
    const [isValid, setIsValid] = useState(true);

    const doSetValues = useCallback(
        (values: JSONValue) => {
            setValues(values);
            if (values) {
                const result = schema.safeParse(values);
                if (!result.success) {
                    const newErrors: Errors = {};
                    for (const issue of result.error.issues) {
                        newErrors[issue.path.join('.')] = issue.message;
                    }
                    setErrors(newErrors);
                    setIsValid(false);
                } else {
                    setErrors({});
                    setIsValid(true);
                }
            }
        },
        [schema],
    );

    // Validate on submit
    const handleSubmit = useCallback(
        (onValid: (data: z.infer<T>) => void) => {
            const result = schema.safeParse(values);
            if (result.success) {
                setErrors({});
                onValid(result.data);
            } else {
                const newErrors: Errors = {};
                for (const issue of result.error.issues) {
                    newErrors[issue.path.join('.')] = issue.message;
                }
                setErrors(newErrors);
            }
        },
        [values, schema],
    );

    return {
        values,
        errors,
        isValid,
        setValues: doSetValues,
        handleSubmit,
    };
}

export type JSONValue =
    | string
    | number
    | boolean
    | object
    | JSONValue[]
    | null
    | undefined;

/** A light JSON Schema type; we only use a subset of fields */
export type JSONSchema = {
    type?: string | string[];
    enum?: JSONValue[];
    enumMeta?: Record<string, { label: string; description?: string }>;
    const?: JSONValue;
    default?: JSONValue;
    properties?: Record<string, JSONSchema>;
    required?: string[];
    items?: JSONSchema;
    oneOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    title?: string;
    description?: string;
    minimum?: number;
    maximum?: number;
};

/** ---------- Utilities ---------- */

/** Create a minimal default value for a schema node */
function defaultForSchema(schema: JSONSchema): JSONValue {
    if (schema.default !== undefined) return schema.default;

    // const wins if present
    if (schema.const !== undefined) return schema.const;

    if (schema.enum && schema.enum.length) return schema.enum[0];

    if (schema.oneOf) {
        return defaultForSchema(schema.oneOf[0]);
    }

    if (schema.anyOf) {
        return defaultForSchema(schema.anyOf[0]);
    }

    const t = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (t) {
        case 'string':
            return '';
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'object': {
            const obj: Record<string, unknown> = {};
            if (schema.properties) {
                for (const [k, v] of Object.entries(schema.properties)) {
                    obj[k] = defaultForSchema(v);
                }
            }
            return obj;
        }
        default:
            // if we can’t infer, return undefined and let parent decide
            return undefined;
    }
}

/** Set a (possibly nested) field on an object immutably */
function setField(obj: unknown, key: string, val: unknown) {
    return { ...(obj ?? {}), [key]: val };
}

/** Try to infer a discriminator key from `oneOf`/`anyOf` options.
 *  Heuristic: find a property name that exists in every option and whose schema
 *  is a const or an enum with a single string value (e.g. { mode: { const: "all" } }).
 */
function inferDiscriminatorKey(options: JSONSchema[]): string | null {
    if (!options.length) return null;

    // Collect candidate property names present in all options
    const commonKeys = options
        .map((opt) => Object.keys(opt.properties ?? {}))
        .reduce<string[]>((acc, keys, idx) => {
            if (idx === 0) return keys;
            return acc.filter((k) => keys.includes(k));
        }, []);

    for (const key of commonKeys) {
        const allDiscriminative = options.every((opt) => {
            const prop = opt.properties?.[key];
            if (!prop) return false;
            if (prop.const !== undefined && typeof prop.const === 'string')
                return true;
            if (
                prop.enum &&
                prop.enum.length === 1 &&
                typeof prop.enum[0] === 'string'
            )
                return true;
            return false;
        });
        if (allDiscriminative) return key;
    }

    return null;
}

/** Read the discriminator value for a given option (const or single enum value) */
function readDiscriminatorValue(
    opt: JSONSchema,
    key: string,
): { dv: string | null; title?: string; description?: string } {
    const prop = opt.properties?.[key];
    if (!prop) return { dv: null };
    if (prop.const !== undefined)
        return {
            dv: String(prop.const),
            title: prop.title,
            description: prop.description,
        };
    if (prop.enum && prop.enum.length === 1)
        return {
            dv: String(prop.enum[0]),
            title: prop.title,
            description: prop.description,
        };
    return { dv: null };
}

/** Find option index that matches current value via discriminator, else -1 */
function findActiveOptionIndex(
    options: JSONSchema[],
    discrKey: string | null,
    value: Record<string, unknown>,
): number {
    if (!discrKey || !value || typeof value !== 'object') return -1;
    const v = value[discrKey];
    if (v === undefined) return -1;

    for (let i = 0; i < options.length; i++) {
        const { dv } = readDiscriminatorValue(options[i], discrKey);
        if (dv !== null && dv === String(v)) return i;
    }
    return -1;
}

/** Ensure the discriminator field is set on an object to match the chosen option */
function enforceDiscriminator(
    obj: JSONValue,
    option: JSONSchema,
    discrKey: string | null,
) {
    if (!discrKey) return obj;
    const { dv } = readDiscriminatorValue(option, discrKey);
    if (dv == null) return obj;
    return setField(obj ?? {}, discrKey, dv);
}

/** Shallow-merge defaults from option into value, preserving existing fields */
function mergeDefaultsForOption(value: JSONValue, option: JSONSchema) {
    const def = defaultForSchema(option);
    if (def && typeof def === 'object') {
        return { ...(def || {}), ...((value as object) || {}) };
    }
    return value ?? def;
}

function childSchemaNeedsContainer(schema: JSONSchema) {
    return (
        schema.oneOf ||
        schema.anyOf ||
        schema.type === 'object' ||
        schema.type === 'array'
    );
}

/** ---------- Renderer ---------- */
function OneOfAnyOfRenderer({
    schema,
    value,
    onChange,
    errors,
    path,
}: JsonSchemaRendererProps) {
    const options = (schema.oneOf ?? schema.anyOf)!;
    const discrKey = useMemo(() => inferDiscriminatorKey(options), [options]);

    // Try to pick an active option based on current value and discriminator.
    const derivedActiveIdx = findActiveOptionIndex(
        options,
        discrKey,
        value as Record<string, unknown>,
    );
    const [activeIdx, setActiveIdx] = useState(
        derivedActiveIdx >= 0 ? derivedActiveIdx : 0,
    );

    // Keep activeIdx in sync if external value changes to a different branch.
    useEffect(() => {
        const idx = findActiveOptionIndex(
            options,
            discrKey,
            value as Record<string, unknown>,
        );
        if (idx >= 0 && idx !== activeIdx) setActiveIdx(idx);
    }, [value, options, discrKey, activeIdx]);

    const activeSchema = options[activeIdx];

    // Build selector options
    const selectorOptions = options.map((opt, i) => {
        let label = `Option ${i + 1}`;
        let description: string | undefined = undefined;
        if (discrKey) {
            const { title, description: desc } = readDiscriminatorValue(
                opt,
                discrKey,
            );
            if (title) label = title;
            description = desc;
        }
        // Fall back to title if present
        if (opt.title) label = opt.title;
        return { value: String(i), label, description };
    });

    // When switching branch
    const handleVariantChange = (newIdxStr: string) => {
        const idx = parseInt(newIdxStr, 10);
        const nextSchema = options[idx];
        // Seed value with defaults for that option and enforce discriminator
        let nextVal = mergeDefaultsForOption(value, nextSchema);
        nextVal = enforceDiscriminator(nextVal, nextSchema, discrKey);
        setActiveIdx(idx);
        onChange(nextVal);
    };

    return (
        <Box>
            <Box
                sx={{
                    marginBottom: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                <FormControl fullWidth>
                    <InputLabel>{schema.title ?? 'Variant'}</InputLabel>
                    <Select
                        label={schema.title ?? 'Variant'}
                        value={String(activeIdx)}
                        onChange={(e) => handleVariantChange(e.target.value)}
                    >
                        {selectorOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                                {o.description ? (
                                    <Tooltip title={o.description}>
                                        <ListItemText>{o.label}</ListItemText>
                                    </Tooltip>
                                ) : (
                                    o.label
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <JsonSchemaRenderer
                schema={activeSchema}
                value={enforceDiscriminator(
                    value as object,
                    activeSchema,
                    discrKey,
                )}
                onChange={(v) =>
                    onChange(enforceDiscriminator(v, activeSchema, discrKey))
                }
                errors={errors}
                path={path}
            />
        </Box>
    );
}

interface JsonSchemaRendererProps {
    schema: JSONSchema;
    value: JSONValue;
    onChange: (val: JSONValue) => void;
    errors: Record<string, string>;
    path: string;
}

export function JsonSchemaRenderer({
    schema,
    value,
    onChange,
    errors,
    path,
}: JsonSchemaRendererProps) {
    if (!schema) return null;

    /** ----- oneOf / anyOf ----- */
    if (schema.oneOf || schema.anyOf) {
        return (
            <OneOfAnyOfRenderer
                schema={schema}
                value={value}
                onChange={onChange}
                errors={errors}
                path={path}
            />
        );
    }

    /** ----- enums (simple select) ----- */
    if (schema.enum) {
        return (
            <Select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                sx={{ width: '100%' }}
            >
                {schema.enum.map((opt) => {
                    const optVal = String(opt);
                    const label = schema.enumMeta
                        ? schema.enumMeta[optVal]?.label
                        : optVal;
                    const description = schema.enumMeta
                        ? schema.enumMeta[optVal]?.description
                        : undefined;
                    return (
                        <MenuItem key={optVal} value={optVal}>
                            {description ? (
                                <Tooltip title={description}>
                                    <ListItemText>
                                        {label ? label : optVal}
                                    </ListItemText>
                                </Tooltip>
                            ) : label ? (
                                label
                            ) : (
                                optVal
                            )}
                        </MenuItem>
                    );
                })}
            </Select>
        );
    }

    /** ----- const (render as read-only tag and enforce) ----- */
    if (schema.const !== undefined) {
        const constVal = schema.const;
        if (value !== constVal) onChange(constVal); // ensure it’s set
        return null;
    }

    /** ----- object ----- */
    if (schema.type === 'object' && schema.properties) {
        const keys = Object.keys(schema.properties);
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                }}
            >
                {keys.map((key) => {
                    const propSchema = schema.properties![key];
                    const label = propSchema.title ?? key;
                    const v = ((value ?? {}) as Record<string, unknown>)[key];
                    const newPath = path ? `${path}.${key}` : key;
                    const error = errors[newPath];

                    if (propSchema.const !== undefined) {
                        return null;
                    }

                    const content = (
                        <JsonSchemaRenderer
                            schema={propSchema}
                            value={
                                v === undefined
                                    ? defaultForSchema(propSchema)
                                    : v
                            }
                            onChange={(val) =>
                                onChange(setField(value, key, val))
                            }
                            errors={errors}
                            path={newPath}
                        />
                    );

                    if (childSchemaNeedsContainer(propSchema)) {
                        return (
                            <Card
                                key={key}
                                variant="outlined"
                                component="fieldset"
                                sx={{
                                    background: 'unset',
                                    width: '100%',
                                    borderColor: error
                                        ? 'error.main'
                                        : 'divider',
                                }}
                            >
                                <Typography
                                    component="legend"
                                    sx={{
                                        p: 1,
                                        color: error ? 'error.main' : '',
                                    }}
                                >
                                    {label}
                                </Typography>
                                <CardContent sx={{ pt: 0 }}>
                                    {propSchema.description && (
                                        <Typography
                                            variant="body2"
                                            sx={{ mb: 2 }}
                                        >
                                            {propSchema.description}
                                        </Typography>
                                    )}
                                    {error && (
                                        <Typography
                                            sx={{
                                                color: error
                                                    ? 'error.main'
                                                    : '',
                                                mb: 2,
                                            }}
                                        >
                                            {error}
                                        </Typography>
                                    )}
                                    {content}
                                </CardContent>
                            </Card>
                        );
                    }
                    return <Box key={key}>{content}</Box>;
                })}
            </Box>
        );
    }

    /** ----- arrays ----- */
    if (schema.type === 'array' && schema.items) {
        const list: JSONValue[] = Array.isArray(value) ? value : [];
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '100%',
                }}
            >
                {list.map((item, idx) => {
                    const idxPath = path ? `${path}.${idx}` : `${idx}`;
                    const error = errors[idxPath];

                    const content = (
                        <JsonSchemaRenderer
                            schema={schema.items ?? {}}
                            value={item}
                            onChange={(val) => {
                                const next = list.slice();
                                next[idx] = val;
                                onChange(next);
                            }}
                            errors={errors}
                            path={idxPath}
                        />
                    );
                    return (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                width: '100%',
                            }}
                        >
                            {childSchemaNeedsContainer(schema.items!) ? (
                                <Card
                                    variant="outlined"
                                    sx={{
                                        background: 'unset',
                                        width: '100%',
                                        borderColor: error
                                            ? 'error.main'
                                            : 'divider',
                                    }}
                                >
                                    <CardContent>
                                        {error && (
                                            <Typography
                                                sx={{
                                                    color: 'error.main',
                                                    mb: 2,
                                                }}
                                            >
                                                {error}
                                            </Typography>
                                        )}
                                        {content}
                                    </CardContent>
                                </Card>
                            ) : (
                                content
                            )}
                            <IconButton
                                type="button"
                                color="error"
                                onClick={() => {
                                    const next = list.filter(
                                        (_, i) => i !== idx,
                                    );
                                    onChange(next);
                                }}
                            >
                                <Delete />
                            </IconButton>
                        </Box>
                    );
                })}

                <Button
                    type="button"
                    color="success"
                    onClick={() =>
                        onChange([
                            ...list,
                            defaultForSchema(schema.items!),
                        ] as unknown[])
                    }
                    startIcon={<Add />}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderStyle: 'dashed',
                    }}
                >
                    Add
                </Button>
            </Box>
        );
    }

    /** ----- primitives ----- */
    const t = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    if (t === 'string') {
        return (
            <TextField
                label={schema.title}
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value)}
                error={!!errors[path]}
                helperText={errors[path]}
                sx={{ width: '100%' }}
            />
        );
    }
    if (t === 'number' || t === 'integer') {
        return (
            <>
                <NumberField
                    label={schema.title}
                    value={(value as number) ?? ''}
                    error={!!errors[path]}
                    helperText={errors[path]}
                    onChange={(val) => onChange(val ?? undefined)}
                    sx={{ width: '100%' }}
                    min={schema.minimum}
                    max={schema.maximum}
                />
            </>
        );
    }
    if (t === 'boolean') {
        return (
            <Checkbox
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
            />
        );
    }

    // Fallback
    return (
        <Box sx={{ fontSize: 12, opacity: 0.7 }}>
            Unsupported schema: {schema.type ?? 'unknown'}
        </Box>
    );
}
