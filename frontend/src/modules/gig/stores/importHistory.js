import { defineStore } from 'pinia';
import historyMock from '@/mock/data-files-history.json';
import api from '@core/services/api';

// Persistência pedida: escrever diretamente no mock via endpoint dev
// (não usa localStorage)

const coerceNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return fallback;
};

// IDs no mock são numéricos e sequenciais (gerados no backend dev)

const normalizeItem = (item) => ({
    requestId: Number(item.requestId ?? 0),
    timestamp: new Date(item.timestamp ?? Date.now()).toISOString(),
    level: item.level === 'WARN' || item.level === 'ERROR' ? item.level : 'INFO',
    status: ['UPLOADED', 'FAILED', 'VALIDATION_ERROR'].includes(item.status) ? item.status : 'UPLOADED',
    userId: item.userId ?? null,
    displayName: item.displayName ?? '',
    avatar: item.avatar ?? '',
    clientId: item.clientId ?? 'demo',
    fileName: item.fileName ?? 'arquivo.csv',
    fileSizeBytes: coerceNumber(item.fileSizeBytes),
    fileHash: item.fileHash ?? null,
    durationMs: item.durationMs == null ? null : coerceNumber(item.durationMs, null),
    totalRows: coerceNumber(item.totalRows),
    errorRows: coerceNumber(item.errorRows)
});

// Carrega somente do mock no disco
const readPersisted = () => null;

const initialItems = () => {
    const persisted = readPersisted();
    if (persisted?.length) return persisted;
    return (historyMock?.items ?? []).map(normalizeItem);
};

export const useImportHistoryStore = defineStore('importHistory', {
    state: () => ({
        items: initialItems()
    }),
    actions: {
        async addEntry(entry) {
            // Persiste no mock via micro-service dev e usa o item salvo (com ID numérico)
            const payload = {
                ...entry,
                requestId: undefined
            };
            try {
                const { data } = await api.post('/dev/mock/import-history/append', payload);
                const saved = normalizeItem(data?.item ?? entry);
                this.items = [saved, ...this.items];
                return saved;
            } catch (error) {
                // fallback: ainda exibe em memória (sem persistir no arquivo)
                const fallback = normalizeItem({ ...entry, requestId: 0 });
                this.items = [fallback, ...this.items];
                return fallback;
            }
        },
        async recordUploadAttempt({ file, response, user }) {
            const ok = response?.ok === true;
            const summary = response?.summary;
            const hasValidationIssues = ok && (summary?.errorRows ?? 0) > 0;
            const level = ok ? (hasValidationIssues ? 'WARN' : 'INFO') : 'ERROR';
            const status = ok ? (hasValidationIssues ? 'VALIDATION_ERROR' : 'UPLOADED') : 'FAILED';
            const baseName = file?.name ?? response?.fileName ?? 'arquivo.csv';
            // hash de integridade: usar valor do backend se vier, senão calcular SHA-256 do arquivo
            let fileHash = response?.fileHash ?? null;
            if (!fileHash && file && typeof window !== 'undefined' && window.crypto?.subtle) {
                try {
                    const buf = await file.arrayBuffer();
                    const digest = await window.crypto.subtle.digest('SHA-256', buf);
                    const bytes = Array.from(new Uint8Array(digest));
                    fileHash = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
                } catch {}
            }
            const entry = {
                level,
                status,
                userId: user?.id ?? null,
                displayName: user?.displayName ?? user?.name ?? null,
                avatar: user?.avatar ?? '',
                clientId: user?.clientId ?? user?.organizationId ?? 'demo',
                fileName: baseName,
                fileSizeBytes: file?.size ?? response?.fileSizeBytes ?? 0,
                fileHash,
                durationMs: response?.durationMs ?? null,
                totalRows: summary?.totalRows ?? 0,
                errorRows: summary?.errorRows ?? (ok ? 0 : (response?.errors?.length ?? 0)),
                timestamp: new Date().toISOString()
            };

            await this.addEntry(entry);
        }
    }
});
