import type { Express, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_MIMES = ['text/csv', 'application/vnd.ms-excel'];

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = ALLOWED_MIMES.includes(file.mimetype);

  if (ext !== '.csv' || !mimeAllowed) {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Formato inválido. Envie apenas CSV.'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});
