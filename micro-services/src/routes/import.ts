import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { s3Client } from '../config/s3.js';
import { buildS3Key } from '../utils/filename.js';
import { appendImportLog } from '../utils/logger.js';
import { analyzeCsvBuffer } from '../utils/csv-analyzer.js';

const router = Router();
const upload = multer();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.userId ?? null;
    const clientId = req.body.clientId ?? null;

    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Nenhum arquivo enviado.' });
    }

    const file = req.file;

    // Hash do arquivo
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    // 🔹 Agora chamamos o analyzer com APENAS o buffer
    const summary = analyzeCsvBuffer(file.buffer);
    const hasValidationIssues = summary.errorRows > 0;

    // ====== S3 KEYS ======
    const objectKey = buildS3Key(clientId, file.originalname);   // relativo
    const s3Key = `${env.aws.prefix}${objectKey}`;               // completo

    // ====== UPLOAD NO S3 ======
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          type: 'synvia-import-file',
          file_hash_sha256: fileHash,
          client_id: clientId?.toString() ?? 'unknown',
          user_id: userId?.toString() ?? 'unknown'
        }
      })
    );

    // ====== LOG NO S3 ======
    await appendImportLog(clientId ?? 'unknown', {
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
      level: hasValidationIssues ? 'WARN' : 'INFO',
      status: hasValidationIssues ? 'VALIDATION_ERROR' : 'UPLOADED',
      userId: userId ?? 'unknown',
      clientId: clientId ?? 'unknown',
      fileName: file.originalname,
      fileSizeBytes: file.size,
      fileHash,
      totalRows: summary.totalRows,
      errorRows: summary.errorRows,
      durationMs: summary.durationMs,
      s3Bucket: env.aws.bucket,
      s3Key,
      errors: summary.errors
    });

    return res.json({
      ok: true,
      message: hasValidationIssues
        ? 'Arquivo enviado com alertas de validação.'
        : 'Arquivo enviado com sucesso.',
      s3Key,
      summary: {
        totalRows: summary.totalRows,
        importedRows: summary.importedRows,
        errorRows: summary.errorRows
      },
      errors: summary.errors
    });

  } catch (error) {
    console.error('[IMPORT ERROR]', error);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao processar o arquivo.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
