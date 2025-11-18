<script setup>
import pkg from '../../package.json';
import AppMenu from './AppMenu.vue';

const appVersion = pkg.version ?? '1.0.0-Beta';
</script>

<template>
    <div class="layout-sidebar">
        <div class="sidebar-scroll">
            <app-menu></app-menu>
        </div>

        <div class="sidebar-footer">
            <span class="sidebar-footer__pill">v{{ appVersion }}</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.layout-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.sidebar-scroll {
    flex: 1;
}

.sidebar-footer {
    margin-top: auto;
    padding: 0.75rem 0.25rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-top: 1px solid color-mix(in srgb, var(--surface-border) 80%, transparent);
}

.sidebar-footer__pill {
    align-self: flex-end;
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.2rem 0.8rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    color: var(--primary-color);
}
</style>
