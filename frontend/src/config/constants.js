/**
 * Constantes globais da aplicação
 */

// Duração padrão da sessão em minutos
export const SESSION_DURATION_MINUTES = 10;

// Intervalo do heartbeat em ms
export const HEARTBEAT_INTERVAL_MS = 50000;

// Intervalo de check de expiração em ms
export const EXPIRATION_CHECK_INTERVAL_MS = 5000;

// Durações padrão das notificações em ms
export const TOAST_DURATION = {
    SUCCESS: 5000, // 5 segundos
    ERROR: 5000, // 5 segundos
    WARNING: 5000, // 5 segundos
    INFO: 5000 // 5 segundos
};

// Tempo de animação de saída da notificação em ms
export const TOAST_ANIMATION_DELAY = 400;

// Tamanho padrão da paginação do histórico de importações
export const HISTORY_PAGE_SIZE = 10;
