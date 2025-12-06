// micro-services/src/server.ts
import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';

import importRoutes from './routes/import.js';
import devRoutes from './routes/dev.js';
import { env } from './config/env.js';

const app = express();

// =============================
// CORS
// =============================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true
  })
);

app.use(express.json());

// =============================
// HEALTHCHECK
// =============================
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'synvia-gig-micro-services',
    env: env.appEnv,
    time: new Date().toISOString()
  });
});

// =============================
// ROTAS PRINCIPAIS
// =============================
//
// FRONT chama:
//   POST http://localhost:3001/gig/import/upload
//
// Portanto, o prefixo deve ser: /gig/import
//
app.use('/gig/import', importRoutes);

// DEV / Testes
app.use('/gig/dev', devRoutes);

// =============================
// HANDLER GLOBAL DE ERROS
// =============================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 ERRO GLOBAL:', err);
  res.status(500).json({
    ok: false,
    message: err.message,
    errors: []
  });
});

// =============================
// START DO SERVIDOR
// =============================
app.listen(env.port, () => {
  console.log(`🚀 Synvia GIG micro-services ativo na porta ${env.port} (APP_ENV=${env.appEnv})`);
});
