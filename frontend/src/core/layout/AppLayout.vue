<script setup>
import { useActivityTracker } from '@core/auth/useActivityTracker';
import { useLayout } from '@core/layout/composables/layout';
import { useAuthStore } from '@core/auth/store';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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

onMounted(() => {
    // Inicia rastreamento de atividade (AppLayout só monta se autenticado)
    if (auth.isAuthenticated && auth.expiresAt) {
        const inactivityDurationMs = auth.durationMinutes * 60 * 1000;
        stopActivityTracker = startTracking(inactivityDurationMs);
    }

    // ⚡ Garantir que o menu fique sempre aberto para rotas GIG
    const isGigRoute = route.path.includes('/gig') || route.path === '/';
    if (isGigRoute) {
        layoutState.staticMenuDesktopInactive = false;
        layoutState.overlayMenuActive = false;
        layoutState.staticMenuMobileActive = false;
    }
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
        // ⚡ Manter menu aberto para rotas principais do GIG
        const isGigRoute = newPath?.includes('/gig') || newPath === '/';
        if (!isGigRoute) {
            closeMenu();
        } else {
            // Garantir que menu fique aberto para rotas GIG
            layoutState.staticMenuDesktopInactive = false;
            layoutState.overlayMenuActive = false;
            layoutState.staticMenuMobileActive = false;
        }
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
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
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
