// src/services/auth.js
import usersData from '@/mock/data-users.json';

export async function login(username, password) {
    const users = usersData.users; // lista do JSON enviada

    const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (!found) {
        return {
            ok: false,
            message: 'Credenciais inválidas.'
        };
    }

    return {
        ok: true,
        token: `fake-token-${found.id}-${Date.now()}`,
        user: found
    };
}
