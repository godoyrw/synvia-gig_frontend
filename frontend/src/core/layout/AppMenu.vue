<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@core/layout/composables/layout';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'APLICAÇÕES',
        items: [
            {
                label: 'SYNVIA - GIG',
                icon: 'pi pi-fw pi-home',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-compass',
                        to: '/gig'
                    },
                    {
                        label: 'Importações',
                        icon: 'pi pi-fw pi-upload',
                        to: '/gig/import'
                    },
                    {
                        label: 'Histórico',
                        icon: 'pi pi-fw pi-history',
                        to: '/gig/history'
                    }
                ]
            }
        ]
    },
    {
        label: 'Documentação Devs',
        items: [
            {
                label: 'Front-end',
                icon: 'pi pi-fw pi-book',
                to: '/documentation'
            },
            {
                label: 'Micro Serviços',
                icon: 'pi pi-fw pi-server',
                to: '/documentation/micro-services'
            }
        ]
    }
]);

const route = useRoute();
const { setActiveMenuItem } = useLayout();

const matchesRoute = (item, path) => {
    if (!item) return false;

    if (item.to && item.to === path) {
        return true;
    }

    if (item.items) {
        return item.items.some((child) => matchesRoute(child, path));
    }

    return false;
};

const routeMatchesAnyItem = (path) => {
    return model.value.some((section) => {
        if (!section.items) return matchesRoute(section, path);
        return section.items.some((item) => matchesRoute(item, path));
    });
};

watch(
    () => route.path,
    (currentPath) => {
        if (!routeMatchesAnyItem(currentPath)) {
            setActiveMenuItem(null);
        }
    }
);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model">
            <app-menu-item v-if="!item.separator" :item="item" :index="i" :key="item.label || i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator" :key="'separator-' + i"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
