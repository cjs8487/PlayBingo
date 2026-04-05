import * as z from 'zod';

export const preprocessNumber = (schema: z.Schema) =>
    z.preprocess((val) => {
        if (!val) {
            return undefined;
        }
        if (typeof val === 'string') {
            return Number(val);
        }
        return val;
    }, schema);
