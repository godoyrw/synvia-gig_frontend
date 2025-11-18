const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-');

export const sanitizeSegment = (value: string) =>
  normalize(value)
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export const sanitizeFileName = (value: string) => {
  const name = value.replace(/\.[^.]+$/, '');
  const extension = '.csv';
  const safeName = sanitizeSegment(name) || 'upload';
  return `${safeName}${extension}`;
};

export const buildS3Key = (clientId: string, originalName: string, date = new Date()) => {
  const safeClient = sanitizeSegment(clientId) || 'client';
  const sanitizedName = sanitizeFileName(originalName);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const timestamp = date.getTime();

  return `${safeClient}imports/${year}/${month}/${day}/${timestamp}-${sanitizedName}`;
};
