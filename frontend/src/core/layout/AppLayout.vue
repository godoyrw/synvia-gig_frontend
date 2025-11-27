<script setup>
import { useActivityTracker } from '@core/auth/useActivityTracker';
import { useLayout } from '@core/layout/composables/layout';
import { useAuthStore } from '@core/auth/store';
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, isSidebarActive, closeMenu } = useLayout();
const route = useRoute();
const auth = useAuthStore();
const { startTracking, stopTracking } = useActivityTracker();
let stopActivityTracker = null;

const outsideClickListener = ref(null);
const suppressOutsideClick = ref(false);

onMounted(() => {
    // Inicia rastreamento de atividade (AppLayout só monta se autenticado)
    if (auth.isAuthenticated && auth.expiresAt) {
        const inactivityDurationMs = auth.durationMinutes * 60 * 1000;
        stopActivityTracker = startTracking(inactivityDurationMs);
    }
    // Ao montar, suprimir cliques externos por curto período para evitar race conditions
    nextTick(() => {
        suppressOutsideClick.value = true;
        setTimeout(() => (suppressOutsideClick.value = false), 500);
    });
});

onUnmounted(() => {
    // Para rastreamento ao desmontar
    if (stopActivityTracker) stopActivityTracker();
    else stopTracking();
});

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

watch(
    () => route.fullPath,
    (newPath, oldPath) => {
        // Ao navegar, fechar apenas menus do tipo overlay / mobile e suprimir
        // cliques externos por curto período para evitar race conditions.
        if (layoutConfig.menuMode === 'overlay' || window.innerWidth <= 991) {
            closeMenu();
        }
        suppressOutsideClick.value = true;
        setTimeout(() => (suppressOutsideClick.value = false), 500);
    }
);


const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                try {
                    // Se estivermos no período de supressão (navegação/boot), ignorar clique externo
                    if (suppressOutsideClick.value) {
                        return;
                    }
                    layoutState.overlayMenuActive = false;
                    layoutState.staticMenuMobileActive = false;
                    layoutState.menuHoverActive = false;
                } catch (e) {
                    console.warn('[AppLayout] outside click handler error', e);
                }
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-topbar');

    if (!sidebarEl) return false;

    const clickedInsideSidebar = sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target);
    const clickedInsideTopbar = topbarEl && (topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));

    return !(clickedInsideSidebar || clickedInsideTopbar);
}
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main layout-main-content">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
</template>
