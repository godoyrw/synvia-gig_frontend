import * as mockService from './importHistoryService.mock';
import * as apiService from './importHistoryService.api';

const flag = import.meta.env.VITE_USE_MOCK_IMPORTS;
const useMock = (flag ?? 'true') === 'true';

// 🔎 LOG DE DEBUG
console.log('[ImportHistory] VITE_USE_MOCK_IMPORTS =', flag);
console.log(`[ImportHistory] Using ${useMock ? 'Mock' : 'API'} implementation`);

const implementation = useMock ? mockService : apiService;

export const isImportHistoryMockEnabled = () => useMock;

export const listImportHistory = (params) => implementation.listImportHistory(params);
export const appendImportHistory = (payload) => implementation.appendImportHistory(payload);
