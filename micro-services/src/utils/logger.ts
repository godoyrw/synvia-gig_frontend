import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { env } from '../config/env.js';
import { s3Client } from '../config/s3.js';
import type { ImportLogEntry } from '../types/import.js';
import { buildLogKey } from './filename.js';

export const bodyToString = async (body?: Readable | Uint8Array | string): Promise<string> => {
  if (!body) return '';

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString('utf-8');
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf-8');
};

export const appendImportLog = async (clientId: string, entry: ImportLogEntry, date = new Date()) => {
  const key = buildLogKey(clientId, date);
  let existingContent = '';

  try {
    const currentLog = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.aws.bucket,
        Key: key
      })
    );

    existingContent = await bodyToString(currentLog.Body as Readable | Uint8Array | string | undefined);
  } catch (error) {
    if ((error as Error)?.name !== 'NoSuchKey') {
      throw error;
    }
  }

  const serializedEntry = JSON.stringify(entry);
  const newBody = existingContent ? `${existingContent}\n${serializedEntry}` : serializedEntry;

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
