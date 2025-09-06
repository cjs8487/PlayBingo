import {
    Box,
    Button,
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Add, Delete } from '@mui/icons-material';

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
    const?: JSONValue;
    default?: JSONValue;
    properties?: Record<string, JSONSchema>;
    required?: string[];
    items?: JSONSchema;
    oneOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    title?: string;
    description?: string;
};

/** ---------- Utilities ---------- */

/** Create a minimal default value for a schema node */
function defaultForSchema(schema: JSONSchema): JSONValue {
    if (schema.default !== undefined) return schema.default;

    // const wins if present
    if (schema.const !== undefined) return schema.const;

    if (schema.enum && schema.enum.length) return schema.enum[0];

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
function readDiscriminatorValue(opt: JSONSchema, key: string): string | null {
    const prop = opt.properties?.[key];
    if (!prop) return null;
    if (prop.const !== undefined) return String(prop.const);
    if (prop.enum && prop.enum.length === 1) return String(prop.enum[0]);
    return null;
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
        const dv = readDiscriminatorValue(options[i], discrKey);
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
    const dv = readDiscriminatorValue(option, discrKey);
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

/** ---------- Renderer ---------- */
function OneOfAnyOfRenderer({
    schema,
    value,
    onChange,
    labels,
    optionLabels,
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
        if (discrKey) {
            const dv = readDiscriminatorValue(opt, discrKey);
            if (dv) label = optionLabels?.[dv] ?? dv;
        }
        // Fall back to title if present
        if (opt.title) label = opt.title;
        return { value: String(i), label };
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
        <Box
            sx={{
                border: '1px solid #444',
                borderRadius: 2,
                padding: 2,
            }}
        >
            <Box
                sx={{
                    marginBottom: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                <FormControl>
                    <InputLabel>{schema.title ?? 'Variant'}</InputLabel>
                    <Select
                        label={schema.title ?? 'Variant'}
                        value={String(activeIdx)}
                        onChange={(e) => handleVariantChange(e.target.value)}
                    >
                        {selectorOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                                {o.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {discrKey && (
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                        {`discriminator: ${discrKey}`}
                    </span>
                )}
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
                labels={labels}
                optionLabels={optionLabels}
            />
        </Box>
    );
}

interface JsonSchemaRendererProps {
    schema: JSONSchema;
    value: JSONValue;
    onChange: (val: JSONValue) => void;
    /** Optional labels for nicer UI (e.g., { listMode: "Goal List Mode" }) */
    labels?: Record<string, string>;
    /** Optional option label mapping for discriminator values (e.g., { "difficulty-filter": "Difficulty Filter" }) */
    optionLabels?: Record<string, string>;
}

export function JsonSchemaRenderer({
    schema,
    value,
    onChange,
    labels,
    optionLabels,
}: JsonSchemaRendererProps) {
    if (!schema) return null;

    /** ----- oneOf / anyOf ----- */
    if (schema.oneOf || schema.anyOf) {
        return (
            <OneOfAnyOfRenderer
                schema={schema}
                value={value}
                onChange={onChange}
                labels={labels}
                optionLabels={optionLabels}
            />
        );
    }

    /** ----- enums (simple select) ----- */
    if (schema.enum) {
        return (
            <Select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
            >
                {schema.enum.map((opt) => (
                    <MenuItem key={String(opt)} value={String(opt)}>
                        {String(opt)}
                    </MenuItem>
                ))}
            </Select>
        );
    }

    /** ----- const (render as read-only tag and enforce) ----- */
    if (schema.const !== undefined) {
        const constVal = schema.const;
        if (value !== constVal) onChange(constVal); // ensure it’s set
        return (
            <span
                style={{
                    padding: '2px 6px',
                    border: '1px solid #555',
                    borderRadius: 4,
                    fontSize: 12,
                    opacity: 0.8,
                }}
                title="fixed"
            >
                {String(constVal)}
            </span>
        );
    }

    /** ----- object ----- */
    if (schema.type === 'object' && schema.properties) {
        const keys = Object.keys(schema.properties);
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {keys.map((key) => {
                    const propSchema = schema.properties![key];
                    const label = labels?.[key] ?? propSchema.title ?? key;
                    const v = ((value ?? {}) as Record<string, unknown>)[key];

                    return (
                        <Box key={key}>
                            <label
                                style={{ display: 'block', marginBottom: 4 }}
                            >
                                {label}
                            </label>
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
                                labels={labels}
                                optionLabels={optionLabels}
                            />
                        </Box>
                    );
                })}
            </Box>
        );
    }

    /** ----- arrays ----- */
    if (schema.type === 'array' && schema.items) {
        const list: JSONValue[] = Array.isArray(value) ? value : [];
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {list.map((item, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <JsonSchemaRenderer
                            schema={schema.items ?? {}}
                            value={item}
                            onChange={(val) => {
                                const next = list.slice();
                                next[idx] = val;
                                onChange(next);
                            }}
                            labels={labels}
                            optionLabels={optionLabels}
                        />
                        <IconButton
                            type="button"
                            color="error"
                            onClick={() => {
                                const next = list.filter((_, i) => i !== idx);
                                onChange(next);
                            }}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                ))}
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
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }
    if (t === 'number' || t === 'integer') {
        return (
            <TextField
                type="number"
                value={(value as number) ?? ''}
                onChange={(e) =>
                    onChange(
                        e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                    )
                }
            />
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
