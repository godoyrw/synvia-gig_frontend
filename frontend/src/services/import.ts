import api from '@/services/api';

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

export async function uploadCsv(file: File): Promise<UploadCsvResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/synvia-gig/import/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
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
    const { data } = await api.get('/import-files/history', {
        params: {
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
            level: params.level ?? '',
            date: params.date
        }
    });

    return data;
}
