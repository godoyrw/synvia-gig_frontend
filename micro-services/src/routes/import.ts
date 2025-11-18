import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { upload } from '../middleware/upload.js';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { analyzeCsvBuffer } from '../utils/csv.js';
import { buildS3Key, sanitizeSegment } from '../utils/filename.js';
import type { UploadResponseBody } from '../types/import.js';

const router = Router();
const uploadSingle = upload.single('file');

const getClientId = (req: Parameters<typeof uploadSingle>[0]) => {
  const claimedClient = req.header('x-client-id');
  // Em produção, nunca confiar apenas em cabeçalhos customizados. Este exemplo supõe
  // que o clientId já tenha sido validado via token JWT ou sessão no gateway/API.
  return sanitizeSegment(claimedClient ?? 'demo');
};

router.post('/synvia-gig/import/upload', (req, res) => {
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
      res.status(400).json(body);
      return;
    }

    if (err) {
      res.status(400).json({
        ok: false,
        message: 'Falha ao processar upload.',
        errors: [{ line: 0, reason: err instanceof Error ? err.message : 'Erro desconhecido.' }]
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        ok: false,
        message: 'Arquivo inválido. Envie um CSV.',
        errors: [{ line: 0, reason: 'Nenhum arquivo enviado ou formato incorreto.' }]
      });
      return;
    }

    try {
      const clientId = getClientId(req);
      const key = buildS3Key(clientId, file.originalname);

      const summary = analyzeCsvBuffer(file.buffer);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.aws.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            uploadedBy: clientId
          }
        })
      );

      const responseBody: UploadResponseBody = {
        ok: true,
        message: 'Importação concluída com sucesso.',
        s3: {
          path: key,
          url: `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`
        },
        summary,
        errors: summary.errors
      };

      res.status(200).json(responseBody);
    } catch (error) {
      console.error('Erro ao importar CSV', error);
      res.status(500).json({
        ok: false,
        message: 'Erro interno ao processar o arquivo.',
        errors: []
      });
    }
  });
});

export default router;
