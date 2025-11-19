import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3Client = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKey,
    secretAccessKey: env.aws.secret
  }
});
