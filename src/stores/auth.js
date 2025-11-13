// src/stores/auth.js
import router from '@/router';
import { login as mockLogin } from '@/services/auth'; // 👈 mantém o mock
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('auth_token') || null,
    user: JSON.parse(sessionStorage.getItem('auth_user') || 'null'),
    expiresAt: Number(sessionStorage.getItem('auth_expires')) || null
  }),

  getters: {
    isAuthenticated: (s) => !!s.token && (!s.expiresAt || Date.now() < s.expiresAt),
    isExpired: (s) => !!s.expiresAt && Date.now() >= s.expiresAt
  },

  actions: {
    /**
     * Login usando o mock de usuários
     */
    async loginWithCredentials(username, password, durationMinutes = 1) {
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
      sessionStorage.setItem('auth_expires', expiresAt);
    },

    /**
     * Logout com opção de redirecionamento por expiração
     */
    logout(expired = false) {
      this.token = null;
      this.user = null;
      this.expiresAt = null;

      sessionStorage.clear();

      if (expired) {
        return router.push('/auth/login?expired=true');
      }

      router.push('/auth/login');
    },

    /**
     * Verifica expiração
     */
    checkExpiration() {
      if (this.isExpired) {
        this.logout(true);
      }
    }
  }
});
