export async function login(username, password) {
    try {
        const response = await fetch('/src/mock/data-users.json');
        const data = await response.json();

        const user = data.users.find((u) => u.username === username && u.password === password);

        if (!user) {
            return { ok: false, message: 'Usuário ou senha inválidos.' };
        }

        // token fake
        const token = `fake-token-${user.id}-${Date.now()}`;
        return { ok: true, token, user };
    } catch (err) {
        console.error('Erro ao ler mock:', err);
        return { ok: false, message: 'Falha ao autenticar.' };
    }
}
