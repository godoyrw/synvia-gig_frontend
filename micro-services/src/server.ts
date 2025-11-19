import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import importRoutes from './routes/import.js';
import { env } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'synvia-gig-micro-services', time: new Date().toISOString() });
});

app.use(importRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, message: err.message, errors: [] });
});

app.listen(env.port, () => {
  console.log(`🚀 Synvia GIG micro-services ativo na porta ${env.port}`);
});
