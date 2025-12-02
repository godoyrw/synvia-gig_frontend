import * as mockService from './usersService.mock';
import * as apiService from './usersService.api';

const useMock = (import.meta.env.VITE_USE_MOCK_USERS ?? 'true') !== 'false';
const implementation = useMock ? mockService : apiService;

export const listUsers = (params) => implementation.listUsers(params);
export const getUserById = (id) => implementation.getUserById(id);
export const createUser = (payload) => implementation.createUser(payload);
export const updateUser = (id, payload) => implementation.updateUser(id, payload);
export const deleteUser = (id) => implementation.deleteUser(id);
export const toggleUserStatus = (id) => implementation.toggleUserStatus(id);
