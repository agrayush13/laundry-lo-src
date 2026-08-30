import { ZodError, type ZodType, type output } from 'zod';
import { validationFailed } from './errors.js';

/**
 * Turns a Zod failure into the contract's `fields` map, so the client can put
 * each message under the input that caused it instead of showing one banner.
 */
export const parse = <S extends ZodType>(schema: S, input: unknown): output<S> => {
    try {
        return schema.parse(input) as output<S>;
    } catch (error) {
        if (error instanceof ZodError) {
            const fields: Record<string, string> = {};
            for (const issue of error.issues) {
                const path = issue.path.join('.') || 'request';
                fields[path] ??= issue.message;
            }
            throw validationFailed(fields);
        }
        throw error;
    }
};

/** `?services=wash-fold,dry-cleaning` and `?services=a&services=b` both work. */
export const csv = (value: string | string[] | undefined): string[] | undefined => {
    if (value === undefined) return undefined;
    const parts = (Array.isArray(value) ? value : [value])
        .flatMap((entry) => entry.split(','))
        .map((entry) => entry.trim())
        .filter(Boolean);
    return parts.length ? parts : undefined;
};
