import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * S3 Client sem credenciais explícitas.
 *
 * LOCAL:
 *   Usa AWS_PROFILE=synvia-dev → ~/.aws/credentials
 *
 * HOMOLOG / PROD:
 *   Usa IAM Role da EC2 automaticamente via Instance Metadata
 */
export const s3Client = new S3Client({
  region: env.aws.region,
});
