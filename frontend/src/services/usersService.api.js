/**
 * Implementação futura para comunicação com API real de usuários.
 * Os endpoints recomendados são:
 * - GET /api/users
 * - GET /api/users/:id
 * - POST /api/users
 * - PUT /api/users/:id
 * - DELETE /api/users/:id
 * - PATCH /api/users/:id/status
 *
 * Observação: em produção a senha deve ser tratada de forma segura (hash no backend, ex.: Argon2id).
 */

const notImplemented = (action) => Promise.reject(new Error(`Not implemented yet: real API /users (${action})`));

export const listUsers = async () => notImplemented('listUsers');
export const getUserById = async () => notImplemented('getUserById');
export const createUser = async () => notImplemented('createUser');
export const updateUser = async () => notImplemented('updateUser');
export const deleteUser = async () => notImplemented('deleteUser');
export const toggleUserStatus = async () => notImplemented('toggleUserStatus');
