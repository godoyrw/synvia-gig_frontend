import historySeed from '@/mock/data-files-history.json';
import { normalizeImportHistoryItem } from './importHistoryNormalizer';

const DEFAULT_LATENCY = 120;

const clone = (value) => JSON.parse(JSON.stringify(value));

const initialItems = () => (historySeed?.items ?? []).map(normalizeImportHistoryItem);

let items = initialItems();
let nextId = items.length ? Math.max(...items.map((item) => Number(item.requestId) || 0)) + 1 : 1;

const resolveWithLatency = (payload, latency = DEFAULT_LATENCY) => new Promise((resolve) => setTimeout(() => resolve(clone(payload)), latency));

export const listImportHistory = async () => {
    return resolveWithLatency({ items });
};

export const appendImportHistory = async (entry = {}) => {
    const normalized = normalizeImportHistoryItem({
        ...entry,
        requestId: entry.requestId ?? nextId++,
        timestamp: entry.timestamp ?? new Date().toISOString()
    });

    items = [normalized, ...items];

    return resolveWithLatency(normalized);
};
