// src/config/env.ts
import 'dotenv/config';

type AppEnv = 'local' | 'homolog' | 'production';

const required = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
    }
    return value;
};

const appEnv: AppEnv =
    (process.env.APP_ENV as AppEnv) ||
    'local';

const resolveS3Prefix = (env: AppEnv): string => {
    // Se veio do .env, respeita
    const fromEnv = process.env.AWS_S3_PREFIX?.trim();
    if (fromEnv && fromEnv.length > 0) {
        // normaliza para sempre terminar com "/"
        return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
    }

    // Fallback seguro por ambiente
    switch (env) {
        case 'production':
            return 'app/';
        case 'homolog':
            return 'app-homolog/';
        case 'local':
        default:
            // local usa homolog como padrão seguro
            return 'app-homolog/';
    }
};

export const env = {
    appEnv,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3001),

    aws: {
        region: process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
        bucket: required('AWS_BUCKET'),
        prefix: resolveS3Prefix(appEnv),
        // OBS: não usamos mais accessKey/secret no código.
        // Para local, o SDK pega do AWS_PROFILE (~/.aws/credentials).
        // Para homolog/prod, o SDK pega da IAM Role da EC2.
    },

    logLevel: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error'
};
