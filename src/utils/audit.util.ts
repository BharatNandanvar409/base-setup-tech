type RecordLike = Record<string, any> | null;

const sensitiveFields = new Set(['password', 'token', 'awsSecretAccessKey', 'accessKey']);

export const sanitizeRecord = (table: string, record: RecordLike): RecordLike => {
    if (!record) return record;
    const copy: Record<string, any> = { ...record };
    for (const field of Object.keys(copy)) {
        if (sensitiveFields.has(field)) {
            copy[field] = '***';
        }
    }
    return copy;
};

export const mergeAuditEvent = (
    prevAccumulator: Record<string, any>,
    table: string,
    prev: RecordLike,
    next: RecordLike
) => {
    const sanitizedPrev = sanitizeRecord(table, prev);
    const sanitizedNext = sanitizeRecord(table, next);
    if (!prevAccumulator.prev_data) prevAccumulator.prev_data = {};
    if (!prevAccumulator.update_data) prevAccumulator.update_data = {};
    if (!prevAccumulator.prev_data[table]) prevAccumulator.prev_data[table] = [];
    if (!prevAccumulator.update_data[table]) prevAccumulator.update_data[table] = [];
    if (sanitizedPrev !== null) prevAccumulator.prev_data[table].push(sanitizedPrev);
    if (sanitizedNext !== null) prevAccumulator.update_data[table].push(sanitizedNext);
    return prevAccumulator;
};


const normlize = (value: any) => {
    if (value === null || value === undefined) return value;
    if (typeof value === "string" && !isNaN(Number(value))) {
        return Number(value);
    }
    if (Array.isArray(value)) {
        return [...value].sort();
    }

    return value;
};


export const diffChangedFields = (prev: Record<string, any>, next: Record<string, any>) => {
    if (!prev || !next) return [];

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const changed = [];

    for (const key of keys) {
        if (["createdAt", "updatedAt", "deletedAt"].includes(key)) continue;

        const a = normlize(prev[key]);
        const b = normlize(next[key]);

        if (JSON.stringify(a) !== JSON.stringify(b)) {
            changed.push(key);
        }
    }

    return changed;
};
