import { Router } from 'express';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const router = Router();

const resolveMockPath = () =>
  path.resolve(process.cwd(), '..', 'frontend', 'src', 'mock', 'data-files-history.json');

async function readMock() {
  const file = resolveMockPath();
  const raw = await fs.readFile(file, 'utf-8');
  const parsed = JSON.parse(raw ?? '{}');
  const items: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
  return { file, items };
}

async function writeMock(file: string, items: any[]) {
  const payload = { items };
  const content = JSON.stringify(payload, null, 2) + '\n';
  await fs.writeFile(file, content, 'utf-8');
}

router.post('/dev/mock/import-history/append', async (req, res) => {
  try {
    const { file, items } = await readMock();

    const allowed = ({
      timestamp,
      level,
      status,
      userId,
      displayName,
      avatar,
      clientId,
      fileName,
      fileSizeBytes,
      fileHash,
      durationMs,
      totalRows,
      errorRows
    }: any) => ({
      timestamp,
      level,
      status,
      userId,
      displayName,
      avatar,
      clientId,
      fileName,
      fileSizeBytes,
      fileHash,
      durationMs,
      totalRows,
      errorRows
    });

    const body = allowed(req.body ?? {});

    const nextId = items.reduce((max, it) => (typeof it.requestId === 'number' && it.requestId > max ? it.requestId : max), 0) + 1;

    const saved = {
      requestId: nextId,
      timestamp: body.timestamp ?? new Date().toISOString(),
      level: body.level ?? 'INFO',
      status: body.status ?? 'UPLOADED',
      userId: body.userId ?? null,
      displayName: body.displayName ?? undefined,
      avatar: body.avatar ?? undefined,
      clientId: body.clientId ?? 'demo',
      fileName: body.fileName ?? 'arquivo.csv',
      fileSizeBytes: Number(body.fileSizeBytes ?? 0),
      fileHash: body.fileHash ?? null,
      durationMs: body.durationMs == null ? null : Number(body.durationMs),
      totalRows: Number(body.totalRows ?? 0),
      errorRows: Number(body.errorRows ?? 0)
    };

    // Mantém novos registros no final do arquivo (ordem cronológica de exemplo)
    items.push(saved);
    await writeMock(file, items);

    res.json({ ok: true, item: saved });
  } catch (error) {
    console.error('Falha ao atualizar mock de histórico:', error);
    res.status(500).json({ ok: false, message: 'Não foi possível persistir no mock.' });
  }
});

export default router;
