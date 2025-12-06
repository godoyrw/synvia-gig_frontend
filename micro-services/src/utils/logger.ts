import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { buildLogKey } from './filename.js';
import { Readable } from 'stream';

export interface ImportLogEntry {
  requestId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  status: 'UPLOADED' | 'FAILED' | 'VALIDATION_ERROR';
  userId: string | number;
  clientId: string | number;
  fileName: string;
  fileSizeBytes: number;
  fileHash: string;
  totalRows: number;
  errorRows: number;
  durationMs: number;
  s3Bucket: string;
  s3Key: string;
  errors?: { line: number; reason: string }[];
}


const streamToString = async (stream: Readable): Promise<string> =>
  await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });

export const appendImportLog = async (clientId: string | number, entry: ImportLogEntry, date = new Date()) => {
  const relativeKey = buildLogKey(clientId, date);   // exemplo: logs/1/2025/12/06.log
  const key = `${env.aws.prefix}${relativeKey}`;     // exemplo: app-homolog/logs/1/2025/12/06.log

  let existingContent = '';

  try {
    const currentLog = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.aws.bucket,
        Key: key
      })
    );

    if (currentLog.Body) {
      existingContent = (await streamToString(currentLog.Body as Readable)).trim();
    }
  } catch (err) {
    // Se não existir o arquivo ainda, criamos do zero
    if (
      !(err as any).Code?.includes('NoSuchKey') &&
      !(err as any).name?.includes('NoSuchKey')
    ) {
      console.error('Erro ao ler log:', err);
    }
  }

  // Serialização
  const serializedEntry = JSON.stringify(entry);
  const newBody = existingContent ? `${existingContent}\n${serializedEntry}` : serializedEntry;

  // Upload atualizado
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.aws.bucket,
      Key: key,
      Body: newBody,
      ContentType: 'application/json',
      Metadata: {
        type: 'synvia-import-log'
      }
    })
  );
};
