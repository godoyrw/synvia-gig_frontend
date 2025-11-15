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
                const oldExpires = auth.expiresAt;
                // Usa o durationMinutes do login, não fixo
                const newExpiresAt = now + auth.durationMinutes * 60 * 1000;
                auth.expiresAt = newExpiresAt;
                sessionStorage.setItem('auth_expires', String(newExpiresAt));

                const extensao = (newExpiresAt - oldExpires) / 1000;
                console.log('[ActivityTracker] ⏰ Atividade detectada:', {
                    hora: new Date(now).toLocaleTimeString(),
                    novoExpira: new Date(newExpiresAt).toLocaleTimeString(),
                    extensaoSegundos: extensao
                });
            }

            // Define novo timer de inatividade
            activityTimeout = setTimeout(() => {
                console.log('[ActivityTracker] ❌ Inatividade por', inactivityDurationMs / 1000, 'segundos');
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
            invidadeMaximaSegundos: inactivityDurationMs / 1000,
            usuario: auth.user?.displayName,
            role: auth.user?.role,
            tokenExpira: new Date(auth.expiresAt).toLocaleTimeString()
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
