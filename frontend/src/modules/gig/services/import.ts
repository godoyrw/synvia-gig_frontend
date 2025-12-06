import { laravelApi } from '@/core/services/laravelApi';
import { microServiceApi } from '@/core/services/microServiceApi';

export interface ImportSummary {
    totalRows: number;
    importedRows: number;
    errorRows: number;
}

export interface ImportRowError {
    line: number;
    reason: string;
}

export interface UploadCsvResponse {
    ok: boolean;
    message: string;
    s3?: {
        path: string;
        url?: string;
    };
    fileHash?: string;
    fileName?: string;
    fileSizeBytes?: number;
    durationMs?: number;
    summary?: ImportSummary;
    errors?: ImportRowError[];
}

export interface ImportHistoryItem {
    requestId: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    status: 'UPLOADED' | 'FAILED' | 'VALIDATION_ERROR';
    userId: number | string | null;
    clientId: number | string;
    fileName: string;
    fileSizeBytes: number;
    fileHash: string | null;
    durationMs: number | null;
    totalRows: number;
    errorRows: number;
}

export interface ImportHistoryResponse {
    ok: boolean;
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    items: ImportHistoryItem[];
}

export async function uploadCsv(
    file: File,
    options: {
        onProgress?: (percent: number, event: any) => void;
        clientId?: string | number | null;
        userId?: string | number | null;
    } = {}
): Promise<UploadCsvResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const clientId = options.clientId ?? null;
    const userId = options.userId ?? null;

    if (clientId !== null && clientId !== undefined) {
        formData.append('clientId', String(clientId));
    }

    if (userId !== null && userId !== undefined) {
        formData.append('userId', String(userId));
    }

    const { data } = await microServiceApi.post('/gig/import/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
            const total = (event.total || 0) as number;
            const loaded = (event.loaded || 0) as number;
            if (total > 0) {
                const percent = Math.round((loaded / total) * 100);
                options.onProgress?.(percent, event);
            }
        }
    });

    return data;
}

export interface FetchImportHistoryParams {
    page?: number;
    pageSize?: number;
    level?: 'ERROR' | 'WARN' | '';
    date?: string;
}

export async function fetchImportHistory(params: FetchImportHistoryParams = {}): Promise<ImportHistoryResponse> {
    const { data } = await laravelApi.get('/import-files/history', {
        params: {
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
            level: params.level ?? '',
            date: params.date
        }
    });

    return data;
}
