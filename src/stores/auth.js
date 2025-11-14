// src/stores/auth.js
import router from '@/router';
import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: sessionStorage.getItem('auth_token') || null,
        user: JSON.parse(sessionStorage.getItem('auth_user') || 'null'),
        expiresAt: Number(sessionStorage.getItem('auth_expires')) || null
    }),

    getters: {
        // usado em guards de rota (é ok usar Date.now aqui, pois o guard roda em toda navegação)
        isAuthenticated: (s) => !!s.token && (!s.expiresAt || Date.now() < s.expiresAt)
    },

    actions: {
        /**
         * Login usando o mock
         */
        async loginWithCredentials(username, password, durationMinutes = 15) {
            const result = await mockLogin(username, password);

            if (!result.ok) {
                throw new Error(result.message || 'Falha na autenticação');
            }

            const expiresAt = Date.now() + durationMinutes * 60 * 1000;

            this.token = result.token;
            this.user = result.user;
            this.expiresAt = expiresAt;

            sessionStorage.setItem('auth_token', this.token);
            sessionStorage.setItem('auth_user', JSON.stringify(this.user));
            sessionStorage.setItem('auth_expires', String(expiresAt));
        },

        /**
         * Logout clássico + por expiração
         */
        logout(expired = false) {
            this.token = null;
            this.user = null;
            this.expiresAt = null;

            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_expires');

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
        }
    }
});
