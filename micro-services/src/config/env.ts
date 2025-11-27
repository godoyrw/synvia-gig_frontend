import 'dotenv/config';

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 3001),
  aws: {
    accessKey: required('AWS_ACCESS_KEY_ID'),
    secret: required('AWS_SECRET_ACCESS_KEY'),
    region: required('AWS_DEFAULT_REGION'),
    bucket: required('AWS_BUCKET')
  }
};
