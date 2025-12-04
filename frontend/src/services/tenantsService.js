import * as mockService from './tenantsService.mock';
import * as apiService from './tenantsService.api';

const useMock = (import.meta.env.VITE_USE_MOCK_TENANTS ?? 'true') === 'true';
const implementation = useMock ? mockService : apiService;

export const listTenants = (params) => implementation.listTenants(params);
export const getTenantById = (id) => implementation.getTenantById(id);
export const createTenant = (payload) => implementation.createTenant(payload);
export const updateTenant = (id, payload) => implementation.updateTenant(id, payload);
export const deleteTenant = (id) => implementation.deleteTenant(id);
export const toggleTenantStatus = (id) => implementation.toggleTenantStatus(id);
