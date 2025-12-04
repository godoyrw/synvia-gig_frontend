import { fetchImportHistory } from './import';
import { normalizeImportHistoryItem } from './importHistoryNormalizer';

export const listImportHistory = async (params = {}) => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;

    try {
        const data = await fetchImportHistory({ page, pageSize });

        return {
            items: (data?.items ?? []).map(normalizeImportHistoryItem),
            page: data?.page ?? page,
            total: data?.total ?? data?.items?.length ?? 0,
            hasNext: data?.hasNext ?? false
        };
    } catch (error) {
        console.warn('[importHistory] API history fetch failed', error);
        return {
            items: [],
            page,
            total: 0,
            hasNext: false
        };
    }
};

export const appendImportHistory = async () => {
    return Promise.reject(new Error('Import history API append not implemented yet'));
};
