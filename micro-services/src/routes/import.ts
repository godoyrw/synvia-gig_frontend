import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { upload } from '../middleware/upload.js';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { analyzeCsvBuffer } from '../utils/csv.js';
import { buildS3Key, sanitizeSegment } from '../utils/filename.js';
import { appendImportLog, readImportLogs } from '../utils/logger.js';
import type { ImportLogEntry, UploadResponseBody } from '../types/import.js';

const router = Router();
const uploadSingle = upload.single('file');
const REQUIRED_COLUMNS = ['guia', 'item', 'procedimento', 'data', 'valor_glosado'];
const DATE_COLUMNS = ['data', 'data_atendimento'];
const NUMERIC_COLUMNS = ['valor_glosado'];
const SERVICE_NAME = 'synvia-gig-importer';
const ENVIRONMENT = process.env.NODE_ENV ?? 'local';

type S3LikeError = Error & {
  Code?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
};

const normalizeS3Error = (error: unknown) => {
  const fallback = {
    message: 'Erro interno ao processar o arquivo.',
    reason: error instanceof Error ? error.message : 'Erro desconhecido ao enviar para o S3.',
    status: 500,
    code: 'UNEXPECTED_INTERNAL_ERROR'
  };

  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const err = error as S3LikeError;
  const code = err.Code ?? err.name;

  if (code === 'NoSuchBucket' || code === 'NotFound') {
    return {
      message: 'Bucket de destino não encontrado.',
      reason: `O bucket ${env.aws.bucket} não existe ou não está acessível na região ${env.aws.region}.`,
      status: 400,
      code: 'NO_SUCH_BUCKET'
    };
  }

  if (code === 'AccessDenied') {
    return {
      message: 'Acesso negado ao bucket configurado.',
      reason: 'Verifique as permissões do usuário/role IAM utilizado pelo micro-serviço.',
      status: 403,
      code: 'S3_ACCESS_DENIED'
    };
  }

  if (code === 'AuthorizationHeaderMalformed') {
    return {
      message: 'Região incorreta configurada para o bucket.',
      reason: `Atualize AWS_DEFAULT_REGION para corresponder à região real do bucket ${env.aws.bucket}.`,
      status: 400,
      code: 'REGION_MISMATCH'
    };
  }

  return {
    message: fallback.message,
    reason: fallback.reason,
    status: err.$metadata?.httpStatusCode ?? fallback.status,
    code: code ?? fallback.code
  };
};

const getClientId = (req: Parameters<typeof uploadSingle>[0]) => {
  const claimedClient = req.header('x-client-id');
  // Em produção, nunca confiar apenas em cabeçalhos customizados. Este exemplo supõe
  // que o clientId já tenha sido validado via token JWT ou sessão no gateway/API.
  return claimedClient ?? 'demo';
};

const parseClientIdentifier = (value: string): number | string => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
};

const parseDateParam = (value?: string | string[]) => {
  if (!value) return new Date();
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

router.post('/gig/import/upload', (req, res) => {
  const clientId = getClientId(req);
  const userId = req.header('x-user-id') ?? null;
  const requestId = randomUUID();
  const startedAt = performance.now();

  const logBase: Omit<ImportLogEntry, 'timestamp' | 'level' | 'status' | 'operation'> = {
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
    client_id: parseClientIdentifier(clientId),
    user_id: userId,
    request_id: requestId
  };

  const writeLog = async (
    entry: Omit<ImportLogEntry, 'service' | 'environment' | 'client_id' | 'user_id' | 'request_id' | 'timestamp'>
  ) => {
    try {
      await appendImportLog(clientId, {
        ...logBase,
        ...entry,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Falha ao registrar log de importação', logError);
    }
  };

  uploadSingle(req, res, async (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const body: UploadResponseBody = {
        ok: false,
        message: 'Arquivo inválido. Envie um CSV.',
        errors: [
          {
            line: 0,
            reason:
              err.code === 'LIMIT_FILE_SIZE'
                ? 'Tamanho máximo excedido (30MB).'
                : 'Nenhum arquivo enviado ou formato incorreto.'
          }
        ]
      };
      await writeLog({
        level: err.code === 'LIMIT_FILE_SIZE' ? 'ERROR' : 'WARN',
        status: 'FAILED',
        operation: 'IMPORT_FILE',
        error_code: err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UNSUPPORTED_MIME_TYPE',
        error_message: body.errors?.[0]?.reason,
        duration_ms: Math.round(performance.now() - startedAt)
      });
      res.status(400).json(body);
      return;
    }

    if (err) {
      const body = {
        ok: false,
        message: 'Falha ao processar upload.',
        errors: [{ line: 0, reason: err instanceof Error ? err.message : 'Erro desconhecido.' }]
      };
      await writeLog({
        level: 'ERROR',
        status: 'FAILED',
        operation: 'IMPORT_FILE',
        error_code: 'UPLOAD_PROCESSING_ERROR',
        error_message: body.errors[0].reason,
        duration_ms: Math.round(performance.now() - startedAt)
      });
      res.status(400).json(body);
      return;
    }

    const file = req.file;
    if (!file) {
      const body = {
        ok: false,
        message: 'Arquivo inválido. Envie um CSV.',
        errors: [{ line: 0, reason: 'Nenhum arquivo enviado ou formato incorreto.' }]
      };
      await writeLog({
        level: 'ERROR',
        status: 'FAILED',
        operation: 'IMPORT_FILE',
        error_code: 'FILE_NOT_FOUND',
        error_message: body.errors[0].reason,
        duration_ms: Math.round(performance.now() - startedAt)
      });
      res.status(400).json(body);
      return;
    }

    try {
      let objectKey: string | null = null;
      const fileHash = createHash('sha256').update(file.buffer).digest('hex');
      const summary = analyzeCsvBuffer(file.buffer, {
        requiredColumns: REQUIRED_COLUMNS,
        dateColumns: DATE_COLUMNS,
        numericColumns: NUMERIC_COLUMNS
      });

      // Se houve erro de parsing do CSV, interrompe fluxo antes de upload
      const hasParseError = summary.errors.some((e) => e.code === 'CSV_PARSE_ERROR');
      if (hasParseError) {
        const parseError = summary.errors.find((e) => e.code === 'CSV_PARSE_ERROR');
        await writeLog({
          level: 'ERROR',
          status: 'FAILED',
          operation: 'IMPORT_FILE_PARSE',
          error_code: 'CSV_PARSE_ERROR',
          error_message: parseError?.reason,
          file_original_name: file.originalname,
          file_size_bytes: file.size,
          file_mime_type: file.mimetype,
          duration_ms: Math.round(performance.now() - startedAt)
        });
        res.status(400).json({
          ok: false,
          message: 'Falha ao analisar CSV.',
          errors: summary.errors
        });
        return;
      }

      if (summary.missingColumns.length) {
        const validationMessage = 'Cabeçalho inválido. Verifique as colunas obrigatórias e tente novamente.';
        await writeLog({
          level: 'ERROR',
          status: 'VALIDATION_ERROR',
          operation: 'IMPORT_FILE_VALIDATE',
          error_code: 'INVALID_HEADER',
          error_message: validationMessage,
          file_original_name: file.originalname,
          file_size_bytes: file.size,
          file_mime_type: file.mimetype,
          duration_ms: Math.round(performance.now() - startedAt),
          extra: {
            missing_columns: summary.missingColumns,
            expected_columns: REQUIRED_COLUMNS,
            received_columns: summary.header
          }
        });
        res.status(400).json({
          ok: false,
          message: validationMessage,
          errors: summary.errors
        });
        return;
      }

      objectKey = buildS3Key(clientId, file.originalname);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.aws.bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            uploadedBy: sanitizeSegment(clientId) || 'demo'
          }
        })
      );

      const duration = Math.round(performance.now() - startedAt);
      const hasValidationIssues = summary.errorRows > 0;

      await writeLog({
        level: hasValidationIssues ? 'WARN' : 'INFO',
        status: hasValidationIssues ? 'VALIDATION_ERROR' : 'UPLOADED',
        operation: 'IMPORT_FILE',
        s3_bucket: env.aws.bucket,
        s3_url: objectKey,
        file_original_name: file.originalname,
        file_size_bytes: file.size,
        file_mime_type: file.mimetype,
        file_hash_sha256: fileHash,
        duration_ms: duration,
        extra: {
          rows_total: summary.totalRows,
          rows_errors: summary.errorRows,
          validation_codes: Array.from(new Set(summary.errors.map((error) => error.code).filter(Boolean)))
        }
      });

      const responseBody: UploadResponseBody = {
        ok: true,
        message: 'Importação concluída com sucesso.',
        s3: {
          path: objectKey,
          url: `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${objectKey}`
        },
        fileHash: fileHash,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        durationMs: duration,
        summary,
        errors: summary.errors
      };

      res.status(200).json(responseBody);
    } catch (error) {
      const parsedError = normalizeS3Error(error);
      console.error('Erro ao importar CSV', error);
      await writeLog({
        level: 'ERROR',
        status: 'FAILED',
        operation: parsedError.code === 'S3_ACCESS_DENIED' ? 'IMPORT_FILE_S3_PUT' : 'IMPORT_FILE',
        error_code: parsedError.code,
        error_message: parsedError.reason ?? parsedError.message,
        duration_ms: Math.round(performance.now() - startedAt)
      });
      res.status(parsedError.status).json({
        ok: false,
        message: parsedError.message,
        errors: parsedError.reason
          ? [
              {
                line: 0,
                reason: parsedError.reason
              }
            ]
          : [],
        fileName: req.file?.originalname,
        fileSizeBytes: req.file?.size
      });
    }
  });
});

export default router;
