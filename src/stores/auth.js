// src/stores/auth.js
import { HEARTBEAT_INTERVAL_MS, SESSION_DURATION_MINUTES } from '@/config/constants';
import usersData from '@/mock/data-users.json';
import router from '@/router';
import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

const usersById = usersData.users.reduce((map, user) => {
    map[user.id] = user;
    return map;
}, {});

const loadStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('auth_user');
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id) {
            return parsed;
        }

        if (typeof parsed === 'string') {
            return usersById[parsed] || null;
        }
    } catch (err) {
        console.warn('[Auth] Falha ao interpretar usuário armazenado:', err);
    }

    return null;
};

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: sessionStorage.getItem('auth_token') || null,
        user: loadStoredUser(),
        expiresAt: Number(sessionStorage.getItem('auth_expires')) || null,
        durationMinutes: Number(sessionStorage.getItem('auth_duration')) || SESSION_DURATION_MINUTES,
        heartbeatInterval: null,
        heartbeatEnabled: false,
        isLoggedOut: false
    }),

    getters: {
        // usado em guards de rota (é ok usar Date.now aqui, pois o guard roda em toda navegação)
        isAuthenticated: (s) => !!s.token && (!s.expiresAt || Date.now() < s.expiresAt)
    },

    actions: {
        /**
         * Login usando o mock
         */
        async loginWithCredentials(username, password, durationMinutes = SESSION_DURATION_MINUTES) {
            const result = await mockLogin(username, password);

            if (!result.ok) {
                throw new Error(result.message || 'Falha na autenticação');
            }

            const expiresAt = Date.now() + durationMinutes * 60 * 1000;

            this.token = result.token;
            this.user = result.user;
            this.expiresAt = expiresAt;
            this.durationMinutes = durationMinutes;
            this.isLoggedOut = false;

            sessionStorage.setItem('auth_token', this.token);
            sessionStorage.setItem('auth_user', JSON.stringify({
                uid: this.user.id,
                clientId: this.user.clientId,
                displayName: this.user.displayName,
                role: this.user.role,
                avatar: this.user.avatar,
                permissions: this.user.permissions
            }));
            sessionStorage.setItem('auth_expires', String(expiresAt));
            sessionStorage.setItem('auth_duration', String(durationMinutes));

            // Inicia heartbeat ao fazer login
            this.startHeartbeat();
        },

        /**
         * Logout clássico + por expiração
         */
        logout(expired = false) {
            this.isLoggedOut = true;
            this.stopHeartbeat();
            this.token = null;
            this.user = null;
            this.expiresAt = null;
            this.durationMinutes = SESSION_DURATION_MINUTES;

            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_expires');
            sessionStorage.removeItem('auth_duration');

            setTimeout(() => {
                if (expired) {
                    router.replace('/auth/login?expired=true');
                } else {
                    router.replace('/auth/login');
                }
            }, 0);
        },

        /**
         * Verifica expiração a qualquer momento
         */
        checkExpiration() {
            if (!this.expiresAt) return;
            const now = Date.now();
            const isExpired = now >= this.expiresAt;
            if (isExpired) {
                this.logout(true);
            }
        },

        /**
         * Inicia heartbeat: monitora sessão como backup
         * Renovação principal feita pelo ActivityTracker (atividade do usuário)
         * @param {number} intervalMs - intervalo em ms (padrão: HEARTBEAT_INTERVAL_MS)
         */
        startHeartbeat(intervalMs = HEARTBEAT_INTERVAL_MS) {
            if (this.heartbeatEnabled) return;

            this.heartbeatEnabled = true;

            this.heartbeatInterval = setInterval(() => {
                const now = Date.now();
                if (!this.expiresAt || !this.token || this.isLoggedOut) {
                    this.stopHeartbeat();
                    return;
                }

                const timeRemaining = this.expiresAt - now;

                // Apenas logout se token expirou (backup)
                if (timeRemaining <= 0) {
                    this.logout(true);
                }
            }, intervalMs);
        },

        /**
         * Para o heartbeat
         */
        stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
            this.heartbeatEnabled = false;
        },

        /**
         * Renova o token (simula refresh com servidor)
         * Em produção, isso faria uma chamada HTTP ao servidor
         */
        async renewToken() {
            try {
                // Não renova se já fez logout
                if (this.isLoggedOut || !this.token) {
                    return;
                }

                // Renova usando o mesmo durationMinutes do login
                const newExpiresAt = Date.now() + this.durationMinutes * 60 * 1000;

                this.expiresAt = newExpiresAt;
                sessionStorage.setItem('auth_expires', String(newExpiresAt));
            } catch (err) {
                console.error('[Auth] ❌ Erro ao renovar token:', err);
                this.logout(true);
            }
        },

        hasPermission(permission) {
            if (!permission) return true;

            const perms = this.user?.permissions || [];
            if (!perms.length) return false;

            if (perms.includes('*') || perms.includes(permission)) {
                return true;
            }

            const [resource, action] = permission.split(':');
            return perms.some((perm) => {
                if (perm === '*') return true;
                if (!perm.includes(':')) {
                    return perm === permission;
                }

                const [permResource, permAction] = perm.split(':');
                if (permResource !== resource) return false;
                return permAction === '*' || permAction === action;
            });
        }
    }
});
