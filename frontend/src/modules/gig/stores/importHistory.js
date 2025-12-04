import { defineStore } from 'pinia';
import historyMock from '@/mock/data-files-history.json';
import { appendImportHistory, isImportHistoryMockEnabled, listImportHistory } from '@modules/gig/services/importHistoryService';
import { normalizeImportHistoryItem } from '@modules/gig/services/importHistoryNormalizer';

const fallbackItems = () => (historyMock?.items ?? []).map(normalizeImportHistoryItem);

export const useImportHistoryStore = defineStore('importHistory', {
    state: () => ({
        items: [],
        loading: false,
        isLoaded: false,
        usingMock: isImportHistoryMockEnabled()
    }),
    actions: {
        updateMockFlag() {
            this.usingMock = isImportHistoryMockEnabled();
        },
        resetState() {
            this.items = [];
            this.loading = false;
            this.isLoaded = false;
        },
        async hydrate(force = false) {
            if (this.loading) return;

            this.updateMockFlag();

            const shouldSkip = !force && this.isLoaded && this.items.length && this.usingMock;
            if (shouldSkip) return;

            this.loading = true;
            if (!this.usingMock) {
                this.items = [];
            }

            try {
                const response = await listImportHistory();
                const rawItems = Array.isArray(response?.items) ? response.items : response;
                if (Array.isArray(rawItems)) {
                    this.items = rawItems.map((item) => normalizeImportHistoryItem(item));
                }
                this.isLoaded = true;
            } catch (error) {
                console.warn('[importHistory] Failed to hydrate history from service', error);
                if (this.usingMock) {
                    this.items = fallbackItems();
                    this.isLoaded = true;
                } else {
                    this.items = [];
                    this.isLoaded = true;
                }
            } finally {
                this.loading = false;
            }
        },
        async addEntry(entry) {
            const payload = { ...entry, requestId: undefined };
            this.updateMockFlag();
            if (!this.usingMock) {
                try {
                    await appendImportHistory(payload);
                } catch (error) {
                    console.warn('[importHistory] append skipped (mock disabled)', error);
                }
                await this.hydrate(true);
                return normalizeImportHistoryItem(entry);
            }
            try {
                const saved = await appendImportHistory(payload);
                const normalized = normalizeImportHistoryItem(saved ?? entry);
                this.items = [normalized, ...this.items];
                return normalized;
            } catch (error) {
                console.warn('[importHistory] append failed, using fallback in-memory entry', error);
                const fallback = normalizeImportHistoryItem({ ...entry, requestId: 0 });
                this.items = [fallback, ...this.items];
                return fallback;
            }
        },
        async recordUploadAttempt({ file, response, user }) {
            this.updateMockFlag();
            const ok = response?.ok === true;
            const summary = response?.summary;
            const hasValidationIssues = ok && (summary?.errorRows ?? 0) > 0;
            const level = ok ? (hasValidationIssues ? 'WARN' : 'INFO') : 'ERROR';
            const status = ok ? (hasValidationIssues ? 'VALIDATION_ERROR' : 'UPLOADED') : 'FAILED';
            const baseName = file?.name ?? response?.fileName ?? 'arquivo.csv';
            let fileHash = response?.fileHash ?? null;
            if (!fileHash && file && typeof window !== 'undefined' && window.crypto?.subtle) {
                try {
                    const buf = await file.arrayBuffer();
                    const digest = await window.crypto.subtle.digest('SHA-256', buf);
                    const bytes = Array.from(new Uint8Array(digest));
                    fileHash = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
                } catch (error) {
                    console.warn('[importHistory] Unable to compute SHA-256 hash locally', error);
                }
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
