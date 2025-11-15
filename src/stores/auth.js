// src/stores/auth.js
import { HEARTBEAT_INTERVAL_MS, SESSION_DURATION_MINUTES } from '@/config/constants';
import router from '@/router';
import { login as mockLogin } from '@/services/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: sessionStorage.getItem('auth_token') || null,
        user: JSON.parse(sessionStorage.getItem('auth_user') || 'null'),
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
            sessionStorage.setItem('auth_user', JSON.stringify(this.user));
            sessionStorage.setItem('auth_expires', String(expiresAt));
            sessionStorage.setItem('auth_duration', String(durationMinutes));

            console.log('[Auth] ✅ Login realizado:', {
                usuario: this.user?.displayName,
                role: this.user?.role,
                duracao: `${durationMinutes} minutos`,
                expiresAt: new Date(expiresAt).toLocaleTimeString()
            });

            // Inicia heartbeat ao fazer login
            this.startHeartbeat();
        },

        /**
         * Logout clássico + por expiração
         */
        logout(expired = false) {
            const tipo = expired ? '⏰ Expiração' : '🚪 Manual';
            console.log(`[Auth] ${tipo} em ${new Date().toLocaleTimeString()}`);

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
            console.log('[Heartbeat] ✅ Iniciado. Intervalo:', intervalMs / 1000, 'segundos');

            this.heartbeatInterval = setInterval(() => {
                const now = Date.now();
                if (!this.expiresAt || !this.token || this.isLoggedOut) {
                    this.stopHeartbeat();
                    return;
                }

                const timeRemaining = this.expiresAt - now;
                const segundos = Math.round(timeRemaining / 1000);
                console.log('[Heartbeat] 💓 Check:', new Date(now).toLocaleTimeString(), `- ${segundos}s restantes`);

                // Apenas logout se token expirou (backup)
                if (timeRemaining <= 0) {
                    console.log('[Heartbeat] ❌ Token expirado! Fazendo logout...');
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
                console.log('[Heartbeat] ⏹️  Parado em', new Date().toLocaleTimeString());
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
                    console.log('[Auth] 🚫 Renovação bloqueada:', { isLoggedOut: this.isLoggedOut, hasToken: !!this.token });
                    return;
                }

                // Renova usando o mesmo durationMinutes do login
                const newExpiresAt = Date.now() + this.durationMinutes * 60 * 1000;

                this.expiresAt = newExpiresAt;
                sessionStorage.setItem('auth_expires', String(newExpiresAt));

                console.log('[Auth] 🔄 Token renovado. Novo expira:', new Date(newExpiresAt).toLocaleTimeString());
            } catch (err) {
                console.error('[Auth] ❌ Erro ao renovar token:', err);
                this.logout(true);
            }
        }
    }
});
