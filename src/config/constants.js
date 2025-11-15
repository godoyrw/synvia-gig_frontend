/**
 * Constantes globais da aplicação
 */

// Duração padrão da sessão em minutos
export const SESSION_DURATION_MINUTES = 5;

// Intervalo do heartbeat em ms
export const HEARTBEAT_INTERVAL_MS = 50000;

// Intervalo de check de expiração em ms
export const EXPIRATION_CHECK_INTERVAL_MS = 5000;

// Durações padrão das notificações em ms
export const NOTIFICATION_DURATION = {
    SUCCESS: 5000,   // 5 segundos
    ERROR: 5000,     // 5 segundos
    WARNING: 5000,   // 5 segundos
    INFO: 5000       // 5 segundos
};

// Tempo de animação de saída da notificação em ms
export const NOTIFICATION_ANIMATION_DELAY = 300;
