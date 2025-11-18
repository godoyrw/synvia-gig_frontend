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
