const coerceNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return fallback;
};

export const normalizeImportHistoryItem = (item = {}) => {
    const safeTimestamp = (() => {
        try {
            const candidate = item.timestamp ?? Date.now();
            const date = new Date(candidate);
            if (Number.isNaN(date.getTime())) {
                return new Date().toISOString();
            }
            return date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    })();

    const level = (() => {
        if (item.level === 'WARN' || item.level === 'ERROR') return item.level;
        return 'INFO';
    })();

    const status = (() => {
        if (item.status === 'FAILED') return 'FAILED';
        if (item.status === 'VALIDATION_ERROR') return 'VALIDATION_ERROR';
        return 'UPLOADED';
    })();

    return {
        requestId: Number(item.requestId ?? 0),
        timestamp: safeTimestamp,
        level,
        status,
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
    };
};
