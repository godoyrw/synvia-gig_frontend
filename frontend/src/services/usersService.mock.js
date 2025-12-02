
import usersSeed from '@/mock/data-users.json';

const storage = typeof window !== 'undefined' ? window.localStorage : null;
const STORAGE_KEY = 'synvia-users-mock';

const hydrateFromStorage = () => {
    if (!storage) return null;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.users)) return parsed.users;
        return null;
    } catch (error) {
        console.warn('[Users mock] failed to parse localStorage payload', error);
        return null;
    }
};

const persistToStorage = (value) => {
    if (!storage) return;
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
        console.warn('[Users mock] failed to persist data to localStorage', error);
    }
};

const ensurePersistShape = (collection) =>
    collection.map((user) => ({
        ...user,
        is_active: user.active !== false
    }));

const DEFAULT_LATENCY = 120;
const clone = (value) => JSON.parse(JSON.stringify(value));

const initialUsers = hydrateFromStorage() ?? usersSeed.users ?? [];

let users = clone(initialUsers).map((user) => ({
    active: user.is_active !== false,
    ...user
}));
let nextId = users.length ? Math.max(...users.map((user) => Number(user.id) || 0)) + 1 : 1;
let nextClientId = users.length ? Math.max(...users.map((user) => Number(user.clientId) || 0)) + 1 : 1;

const persistUsers = () => persistToStorage(ensurePersistShape(users));

persistUsers();

const resolveWithLatency = (payload, latency = DEFAULT_LATENCY) => new Promise((resolve) => setTimeout(() => resolve(clone(payload)), latency));

const findIndexById = (id) => users.findIndex((user) => Number(user.id) === Number(id));

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
    const selectedRoles = normalizeStringArray(params.roles);
    const selectedNames = normalizeStringArray(params.names);
    const selectedModules = normalizeStringArray(params.modules);
    const selectedStatus = normalizeStringArray(params.status).map((status) => (status === 'inactive' ? 'inactive' : 'active'));
    const statusSet = new Set(selectedStatus);
    const rolesSet = new Set(selectedRoles);
    const namesSet = new Set(selectedNames);
    const modulesSet = new Set(selectedModules);

    return collection.filter((user) => {
        const displayName = user.displayName?.trim() || '';
        const username = user.username?.trim() || '';
        const role = user.role?.trim() || '';
        const modules = Array.isArray(user.modules) ? user.modules.map((module) => String(module).trim()).filter(Boolean) : [];
        const activeStatus = user.active === false ? 'inactive' : 'active';

        const matchesSearch = trimmedSearch ? displayName.toLowerCase().includes(trimmedSearch) || username.toLowerCase().includes(trimmedSearch) : true;

        const matchesRole = rolesSet.size ? rolesSet.has(role) : true;
        const matchesName = namesSet.size ? namesSet.has(displayName) : true;
        const matchesModules = modulesSet.size ? modules.some((module) => modulesSet.has(module)) : true;
        const matchesStatus = statusSet.size ? statusSet.has(activeStatus) : true;

        return matchesSearch && matchesRole && matchesName && matchesModules && matchesStatus;
    });
};

const resolveSortValue = (user, field) => {
    switch (field) {
        case 'clientId':
            return Number(user.clientId) || 0;
        case 'displayName':
            return (user.displayName || '').toLowerCase();
        case 'role':
            return (user.role || '').toLowerCase();
        case 'modules': {
            const value = Array.isArray(user.modules) ? user.modules.join(',') : '';
            return value.toLowerCase();
        }
        case 'active':
            return user.active === false ? 0 : 1;
        default:
            return (user[field] ?? '').toString().toLowerCase();
    }
};

const applySorting = (collection, params = {}) => {
    const field = typeof params.sortField === 'string' ? params.sortField : null;
    if (!field) return collection.slice();

    const order = Number(params.sortOrder) === -1 ? -1 : 1;
    return collection
        .slice()
        .sort((a, b) => {
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

export const listUsers = async (params = {}) => {
    const filtered = applyFilters(users, params);
    const sorted = applySorting(filtered, params);
    const paginated = applyPagination(sorted, params);
    return resolveWithLatency(paginated);
};

export const getUserById = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Usuário não encontrado');
    }
    return resolveWithLatency(users[index]);
};

export const createUser = async (payload) => {
    const requestedClientId = Number(payload?.clientId);
    const resolvedClientId = Number.isFinite(requestedClientId) && requestedClientId > 0 ? requestedClientId : nextClientId++;
    if (resolvedClientId >= nextClientId) {
        nextClientId = resolvedClientId + 1;
    }

    const newUser = {
        id: nextId++,
        displayName: '',
        username: '',
        password: '',
        clientId: resolvedClientId,
        role: 'viewer',
        avatar: '',
        modules: [],
        permissions: [],
        active: true,
        ...clone({ ...payload, clientId: resolvedClientId }),
        is_active: payload?.active !== false
    };

    users.push(newUser);
    persistUsers();
    return resolveWithLatency(newUser);
};

export const updateUser = async (id, payload) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Usuário não encontrado');
    }

    const current = users[index];
    const updated = {
        ...current,
        ...clone(payload)
    };

    if (!payload.password) {
        updated.password = current.password;
    }

    users[index] = {
        ...updated,
        is_active: updated.active !== false
    };
    persistUsers();
    return resolveWithLatency(updated);
};

export const deleteUser = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Usuário não encontrado');
    }

    const [removed] = users.splice(index, 1);
    persistUsers();
    return resolveWithLatency(removed);
};

export const toggleUserStatus = async (id) => {
    const index = findIndexById(id);
    if (index === -1) {
        throw new Error('Usuário não encontrado');
    }

    const user = users[index];
    const nextStatus = !user.active;
    users[index] = {
        ...user,
        active: nextStatus,
        is_active: nextStatus
    };
    persistUsers();

    return resolveWithLatency(users[index]);
};
