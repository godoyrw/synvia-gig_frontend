// src/stores/auth.js
import router from '@/router';
import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: sessionStorage.getItem('auth_token') || null,
        user: JSON.parse(sessionStorage.getItem('auth_user') || 'null'),
        expiresAt: Number(sessionStorage.getItem('auth_expires')) || null,
        durationMinutes: Number(sessionStorage.getItem('auth_duration')) || 2,
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
        async loginWithCredentials(username, password, durationMinutes = 2) {
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
            sessionStorage.setItem('auth_user', JSON.stringify(this.user.id));
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
            this.durationMinutes = 2;

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
         * @param {number} intervalMs - intervalo em ms (padrão: 120000 = 2 minutos)
         */
        startHeartbeat(intervalMs = 50000) {
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
        }
    }
});
