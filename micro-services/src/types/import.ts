export interface ImportSummary {
  totalRows: number;
  importedRows: number;
  errorRows: number;
}

export interface ImportRowError {
  line: number;
  reason: string;
}

export interface UploadResponseBody {
  ok: boolean;
  message: string;
  s3?: {
    path: string;
    url?: string;
  };
  summary?: ImportSummary;
  errors?: ImportRowError[];
}
