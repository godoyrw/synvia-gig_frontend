import { useNotificationStore } from '@/stores/notifications';

/**
 * Composable para gerenciar notificações de forma simples
 * Fornece helpers para diferentes tipos de notificações
 *
 * @example
 * const notify = useNotifications()
 * notify.success('Salvo!', 'Dados salvos com sucesso')
 * notify.error('Erro!', 'Algo deu errado')
 * notify.warning('Atenção!', 'Isso pode causar problemas')
 * notify.info('Info', 'Apenas informativo')
 *
 * // Com opções customizadas
 * notify.success('Salvo!', 'Mensagem', {
 *   duration: 3000,
 *   onClose: () => console.log('Fechado')
 * })
 */
export function useNotifications() {
    const store = useNotificationStore();

    return {
        /**
         * Adiciona notificação customizada
         */
        notify: (config) => store.add(config),

        /**
         * Notificação de sucesso
         */
        success: (title, message = '', options = {}) => store.success(title, message, options),

        /**
         * Notificação de erro
         */
        error: (title, message = '', options = {}) => store.error(title, message, options),

        /**
         * Notificação de aviso
         */
        warning: (title, message = '', options = {}) => store.warning(title, message, options),

        /**
         * Notificação informativa
         */
        info: (title, message = '', options = {}) => store.info(title, message, options),

        /**
         * Remove notificação específica
         */
        remove: (id) => store.remove(id),

        /**
         * Remove todas as notificações
         */
        clearAll: () => store.clearAll(),

        /**
         * Verifica se há notificações
         */
        hasNotifications: () => store.hasNotifications,

        /**
         * Total de notificações ativas
         */
        totalNotifications: () => store.totalNotifications
    };
}
