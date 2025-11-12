import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('auth_token') || null,
    user: JSON.parse(sessionStorage.getItem('auth_user') || 'null'),
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    async loginWithCredentials(username, password) {
      const result = await mockLogin(username, password);
      if (!result.ok) throw new Error(result.message);

      this.token = result.token;
      this.user = result.user;
      sessionStorage.setItem('auth_token', this.token);
      sessionStorage.setItem('auth_user', JSON.stringify(this.user));
    },
    logout() {
      this.token = null;
      this.user = null;
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
    },
  },
});
