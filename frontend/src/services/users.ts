import usersData from '@/mock/data-users.json';

export interface User {
    id: number;
    username: string;
    password: string;
    displayName: string;
    clientId: number;
    role: 'admin' | 'analyst' | 'viewer';
    avatar: string;
    permissions: string[];
}

// In-memory store for mock data (simulates backend)
let users: User[] = [...usersData.users];

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return users.map((u) => ({ ...u }));
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const user = users.find((u) => u.id === id);
    return user ? { ...user } : null;
}

/**
 * Create a new user
 */
export async function createUser(data: Omit<User, 'id'>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check for duplicate username
    if (users.some((u) => u.username === data.username)) {
        throw new Error('Já existe um usuário com este e-mail.');
    }

    const newId = Math.max(...users.map((u) => u.id), 0) + 1;
    const newUser: User = {
        id: newId,
        ...data
    };
    users.push(newUser);
    return { ...newUser };
}

/**
 * Update an existing user
 */
export async function updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        throw new Error('Usuário não encontrado.');
    }

    // Check for duplicate username (excluding current user)
    if (data.username && users.some((u) => u.username === data.username && u.id !== id)) {
        throw new Error('Já existe um usuário com este e-mail.');
    }

    users[index] = { ...users[index], ...data };
    return { ...users[index] };
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        throw new Error('Usuário não encontrado.');
    }

    users.splice(index, 1);
}

/**
 * Reset users to initial mock data (useful for testing)
 */
export function resetUsers(): void {
    users = [...usersData.users];
}
