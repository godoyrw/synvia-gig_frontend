import { useAuthStore } from '@/stores/auth';

/**
 * useActivityTracker - Rastreia atividade do usuário e renova token se estiver ativo
 * Logout automático se inativo por muito tempo
 */
export function useActivityTracker() {
    let activityTimeout = null;
    let isTracking = false;
    let removeActivityListeners = null;

    function startTracking(inactivityDurationMs = 10 * 60 * 1000) {
        // 10 minutos padrão
        if (isTracking) return;

        const auth = useAuthStore();
        isTracking = true;

        const events = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        function resetInactivityTimer() {
            // Limpa timer anterior
            if (activityTimeout) clearTimeout(activityTimeout);

            // Renova token quando há atividade
            if (auth.isAuthenticated && auth.expiresAt) {
                const now = Date.now();
                const oldExpiresAt = auth.expiresAt;
                // Usa o durationMinutes do login, não fixo
                const newExpiresAt = now + auth.durationMinutes * 60 * 1000;
                auth.expiresAt = newExpiresAt;
                sessionStorage.setItem('auth_expires', String(newExpiresAt));

                const timeExtended = (newExpiresAt - oldExpiresAt) / 1000; // em segundos
                console.log('[ActivityTracker] ⏰ Atividade detectada:', {
                    timestamp: new Date(now).toLocaleTimeString(),
                    tokenRenovado: new Date(newExpiresAt).toLocaleTimeString(),
                    extensaoSegundos: timeExtended,
                    durationMinutos: auth.durationMinutes
                });
            } else {
                console.log('[ActivityTracker] ⚠️ Não autenticado ou expiresAt não existe');
            }

            // Define novo timer de inatividade
            activityTimeout = setTimeout(() => {
                const agora = new Date().toLocaleTimeString();
                console.log('[ActivityTracker] ❌ Inativo por', inactivityDurationMs / 1000, 'segundos. Logout em:', agora);
                auth.logout(true);
            }, inactivityDurationMs);
        }

        // Armazena função para remover listeners
        removeActivityListeners = () => {
            events.forEach((event) => {
                document.removeEventListener(event, resetInactivityTimer, { passive: true });
            });
        };

        // Adiciona listeners
        events.forEach((event) => {
            document.addEventListener(event, resetInactivityTimer, { passive: true });
        });

        // Inicia o timer - NO PRIMEIRO CALL, JÁ RENOVA O TOKEN
        resetInactivityTimer();

        console.log('[ActivityTracker] 🎯 Rastreamento iniciado:', {
            inividadeMaximaSegundos: inactivityDurationMs / 1000,
            usuario: auth.user?.name || 'Desconhecido',
            tokenExpiresAt: new Date(auth.expiresAt).toLocaleTimeString()
        });

        // Retorna função para parar o rastreamento
        return () => stopTracking();
    }

    function stopTracking() {
        if (!isTracking) return;

        // Remove listeners
        if (removeActivityListeners) {
            removeActivityListeners();
        }

        // Limpa timer
        if (activityTimeout) clearTimeout(activityTimeout);

        isTracking = false;
        console.log('[ActivityTracker] 🛑 Rastreamento parado em', new Date().toLocaleTimeString());
    }

    return {
        startTracking,
        stopTracking,
        isTracking: () => isTracking
    };
}
