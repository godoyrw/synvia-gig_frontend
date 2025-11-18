import { NOTIFICATION_DURATION } from '@/config/constants';
import { defineStore } from 'pinia';

/**
 * Store global para gerenciar notificações da aplicação
 * Suporta múltiplos tipos: success, error, warning, info
 * Cada notificação tem ID único, tipo, mensagem, duração e callback opcional
 */
export const useNotificationStore = defineStore('notifications', {
    state: () => ({
        notifications: [],
        nextId: 0
    }),

    getters: {
        hasNotifications: (state) => state.notifications.length > 0,
        totalNotifications: (state) => state.notifications.length
    },

    actions: {
        /**
         * Adiciona uma nova notificação à fila
         * @param {Object} config - Configuração da notificação
         * @param {string} config.type - Tipo: 'success', 'error', 'warning', 'info'
         * @param {string} config.title - Título da notificação
         * @param {string} config.message - Mensagem principal
         * @param {number} config.duration - Duração em ms (0 = permanente)
         * @param {Function} config.onClose - Callback ao fechar
         * @param {string} config.icon - Ícone PrimeIcons
         * @returns {number} ID da notificação
         */
        add(config) {
            const { type = 'info', title = '', message = '', duration = 5000, onClose = null, icon = null } = config;

            const id = this.nextId++;
            const notification = {
                id,
                type,
                title,
                message,
                duration,
                onClose,
                icon,
                timestamp: Date.now(),
                isClosing: false
            };

            this.notifications.push(notification);

            // Auto-remover se duration > 0
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }

            return id;
        },

        /**
         * Remove uma notificação específica
         * @param {number} id - ID da notificação
         */
        remove(id) {
            const index = this.notifications.findIndex((n) => n.id === id);
            if (index > -1) {
                const notification = this.notifications[index];
                notification.isClosing = true;

                // Remover imediatamente ao clicar (sem delay extra)
                setTimeout(() => {
                    const currentIndex = this.notifications.findIndex((n) => n.id === id);
                    if (currentIndex > -1) {
                        const removed = this.notifications.splice(currentIndex, 1)[0];
                        if (removed?.onClose) {
                            removed.onClose();
                        }
                    }
                }, 100); // Apenas 100ms para animação de saída
            }
        },

        /**
         * Remove todas as notificações
         */
        clearAll() {
            this.notifications.forEach((n) => {
                if (n.onClose) n.onClose();
            });
            this.notifications = [];
        },

        /**
         * Helper: Notificação de sucesso
         */
        success(title, message = '', options = {}) {
            return this.add({
                type: 'success',
                title,
                message,
                duration: NOTIFICATION_DURATION.SUCCESS,
                icon: 'pi-check-circle',
                ...options
            });
        },

        /**
         * Helper: Notificação de erro
         */
        error(title, message = '', options = {}) {
            return this.add({
                type: 'error',
                title,
                message,
                duration: NOTIFICATION_DURATION.ERROR,
                icon: 'pi-exclamation-circle',
                ...options
            });
        },

        /**
         * Helper: Notificação de aviso
         */
        warning(title, message = '', options = {}) {
            return this.add({
                type: 'warning',
                title,
                message,
                duration: NOTIFICATION_DURATION.WARNING,
                icon: 'pi-exclamation-triangle',
                ...options
            });
        },

        /**
         * Helper: Notificação informativa
         */
        info(title, message = '', options = {}) {
            return this.add({
                type: 'info',
                title,
                message,
                duration: NOTIFICATION_DURATION.INFO,
                icon: 'pi-info-circle',
                ...options
            });
        }
    }
});
