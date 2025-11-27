export interface ImportSummary {
  totalRows: number;
  importedRows: number;
  errorRows: number;
}

export interface ImportRowError {
  line: number;
  reason: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface UploadResponseBody {
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

export interface ImportLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  environment: string;
  client_id: number | string;
  user_id?: number | string | null;
  request_id: string;
  operation: string;
  status: 'UPLOADED' | 'FAILED' | 'VALIDATION_ERROR';
  s3_bucket?: string;
  s3_url?: string;
  file_original_name?: string;
  file_size_bytes?: number;
  file_mime_type?: string;
  file_hash_sha256?: string;
  duration_ms?: number;
  error_code?: string;
  error_message?: string;
  extra?: Record<string, unknown>;
}
