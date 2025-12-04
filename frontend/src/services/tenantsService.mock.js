import tenantsSeed from '@/mock/data-tenants.json';

const storage = typeof window !== 'undefined' ? window.localStorage : null;
const STORAGE_KEY = 'synvia-tenants-mock';
const DEFAULT_LATENCY = 120;
const clone = (value) => JSON.parse(JSON.stringify(value));

const hydrateFromStorage = () => {
    if (!storage) return null;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.tenants)) return parsed.tenants;
        return null;
    } catch (error) {
        console.warn('[Tenants mock] failed to parse localStorage payload', error);
        return null;
    }
};

const persistToStorage = (value) => {
    if (!storage) return;
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
        console.warn('[Tenants mock] failed to persist data to localStorage', error);
    }
};

const ensurePersistShape = (collection) =>
    collection.map((tenant) => ({
        ...tenant,
        is_active: tenant.active !== false
    }));

const initialTenants = hydrateFromStorage() ?? tenantsSeed.tenants ?? [];

let tenants = clone(initialTenants).map((tenant) => ({
    active: tenant.is_active !== false,
    ...tenant
}));
let nextId = tenants.length ? Math.max(...tenants.map((tenant) => Number(tenant.id) || 0)) + 1 : 1;

const persistTenants = () => persistToStorage(ensurePersistShape(tenants));

persistTenants();

const resolveWithLatency = (payload, latency = DEFAULT_LATENCY) => new Promise((resolve) => setTimeout(() => resolve(clone(payload)), latency));

const findIndexById = (id) => tenants.findIndex((tenant) => Number(tenant.id) === Number(id));

const normalizeStringArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => (item == null ? '' : String(item).trim())).filter((item) => item.length);
    }
    const single = String(value).trim();
    return single ? [single] : [];
};

const applyFilters = (collection, params = {}) => {
    const trimmedSearch = (params.search || '').trim().toLowerCase();
    const selectedPlans = normalizeStringArray(params.plans);
    const selectedModules = normalizeStringArray(params.modules);
    const selectedStatus = normalizeStringArray(params.status).map((status) => (status === 'inactive' ? 'inactive' : 'active'));

    const plansSet = new Set(selectedPlans);
    const modulesSet = new Set(selectedModules);
    const statusSet = new Set(selectedStatus);

    return collection.filter((tenant) => {
        const name = tenant.name?.trim() || '';
        const tradeName = tenant.tradeName?.trim() || '';
        const email = tenant.primaryEmail?.trim() || '';
        const document = tenant.document?.trim() || '';
        const modules = Array.isArray(tenant.modules) ? tenant.modules.map((module) => String(module).trim()).filter(Boolean) : [];
        const activeStatus = tenant.active === false ? 'inactive' : 'active';

        const matchesSearch = trimmedSearch ? name.toLowerCase().includes(trimmedSearch) || tradeName.toLowerCase().includes(trimmedSearch) || email.toLowerCase().includes(trimmedSearch) || document.toLowerCase().includes(trimmedSearch) : true;

        const matchesPlan = plansSet.size ? plansSet.has((tenant.plan || '').toLowerCase()) : true;
        const matchesModules = modulesSet.size ? modules.some((module) => modulesSet.has(module)) : true;
        const matchesStatus = statusSet.size ? statusSet.has(activeStatus) : true;

        return matchesSearch && matchesPlan && matchesModules && matchesStatus;
    });
};

const resolveSortValue = (tenant, field) => {
    switch (field) {
        case 'name':
            return (tenant.name || '').toLowerCase();
        case 'plan':
            return (tenant.plan || '').toLowerCase();
        case 'modules':
            return Array.isArray(tenant.modules) ? tenant.modules.join(',').toLowerCase() : '';
        case 'active':
            return tenant.active === false ? 0 : 1;
        case 'createdAt':
            return tenant.createdAt ? new Date(tenant.createdAt).getTime() : 0;
        default:
            return (tenant[field] ?? '').toString().toLowerCase();
    }
};

const applySorting = (collection, params = {}) => {
    const field = typeof params.sortField === 'string' ? params.sortField : null;
    if (!field) return collection.slice();

    const order = Number(params.sortOrder) === -1 ? -1 : 1;
    return collection.slice().sort((a, b) => {
        const av = resolveSortValue(a, field);
        const bv = resolveSortValue(b, field);

        if (typeof av === 'number' && typeof bv === 'number') {
            return (av - bv) * order;
        }

        if (av == null && bv != null) return -1 * order;
        if (av != null && bv == null) return 1 * order;
        if (av == null && bv == null) return 0;

        const aStr = String(av);
        const bStr = String(bv);

        if (aStr < bStr) return -1 * order;
        if (aStr > bStr) return 1 * order;
        return 0;
    });
};

const applyPagination = (collection, params = {}) => {
    const page = Math.max(1, Number(params.page) || 1);
    const rows = Math.max(1, Number(params.rows) || 10);
    const start = (page - 1) * rows;
    const end = start + rows;

    return {
        page,
        rows,
        total: collection.length,
        data: collection.slice(start, end)
    };
};

export const listTenants = async (params = {}) => {
    const filtered = applyFilters(tenants, params);
    const sorted = applySorting(filtered, params);
    const paginated = applyPagination(sorted, params);
    return resolveWithLatency(paginated);
};

export const getTenantById = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Cliente não encontrado');
    }
    return resolveWithLatency(tenants[index]);
};

export const createTenant = async (payload = {}) => {
    const createdAt = payload.createdAt || new Date().toISOString();
    const isActive = payload.is_active !== false && payload.active !== false;

    const newTenant = {
        id: nextId++,
        name: '',
        tradeName: '',
        document: '',
        primaryEmail: '',
        primaryPhone: '',
        plan: 'basic',
        logoUrl: '',
        modules: [],
        notes: '',
        createdAt,
        ...clone(payload),
        active: isActive,
        is_active: isActive
    };

    tenants.push(newTenant);
    persistTenants();
    return resolveWithLatency(newTenant);
};

export const updateTenant = async (id, payload = {}) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Cliente não encontrado');
    }

    const current = tenants[index];
    const isActive = payload.is_active !== undefined ? payload.is_active : current.active !== false;
    const updated = {
        ...current,
        ...clone(payload),
        active: isActive,
        is_active: isActive
    };

    tenants[index] = updated;
    persistTenants();
    return resolveWithLatency(updated);
};

export const deleteTenant = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Cliente não encontrado');
    }

    const [removed] = tenants.splice(index, 1);
    persistTenants();
    return resolveWithLatency(removed);
};

export const toggleTenantStatus = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Cliente não encontrado');
    }

    const tenant = tenants[index];
    const nextStatus = !tenant.active;
    tenants[index] = {
        ...tenant,
        active: nextStatus,
        is_active: nextStatus
    };
    persistTenants();

    return resolveWithLatency(tenants[index]);
};
