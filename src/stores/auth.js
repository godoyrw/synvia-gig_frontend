import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || null,
    user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
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
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(this.user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    },
  },
});
