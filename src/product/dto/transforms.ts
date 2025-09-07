// dto/transforms.ts
import { TransformFnParams } from 'class-transformer';

export function toNumberOrUndefined({ value }: TransformFnParams) {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

export function toBoolean({ value }: TransformFnParams) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
}

export function toDateOrUndefined({ value }: TransformFnParams) {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Accepts:
 * - real arrays (JSON body)
 * - JSON-stringified arrays (form-data: '["a","b"]')
 * - comma-separated strings (form-data: 'a,b')
 */
export function toArray({ value }: TransformFnParams) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) {
            // fall through to CSV
        }
        return trimmed.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [];
}
