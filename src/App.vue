<script setup>
import { useActivityTracker } from '@/composables';
import { useAuthStore } from '@/stores/auth';
import { onMounted, onUnmounted } from 'vue';

const auth = useAuthStore();
const { startTracking, stopTracking } = useActivityTracker();
let stopActivityTracker = null;

onMounted(() => {
    // Inicia rastreamento de atividade se autenticado
    if (auth.isAuthenticated && auth.expiresAt) {
        // Inatividade máxima = exatamente o durationMinutes
        const inactivityDurationMs = auth.durationMinutes * 60 * 1000;

        stopActivityTracker = startTracking(inactivityDurationMs);
    }
});

onUnmounted(() => {
    // Para rastreamento ao desmontar
    if (stopActivityTracker) stopActivityTracker();
    else stopTracking();
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>
