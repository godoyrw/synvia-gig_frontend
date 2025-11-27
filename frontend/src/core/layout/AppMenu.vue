<script setup>
import { ref, watch, onMounted } from 'vue';
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

// Busca recursiva no model para construir a chave do item que corresponde à rota
const findItemKeyForPath = (path) => {
    const sections = model.value;

    for (let s = 0; s < sections.length; s++) {
        const section = sections[s];

        if (!section.items) continue;

        for (let i = 0; i < section.items.length; i++) {
            const item = section.items[i];
            // chave base para o item filho da seção: `${s}-${i}`
            const baseKey = `${s}-${i}`;
            const found = findInItem(item, baseKey);
            if (found) return found;
        }
    }

    return null;
};

function findInItem(item, keyPrefix) {
    // Se o item tem um `to` e corresponde à rota, retorna a chave construída
    if (item.to && item.to === route.path) {
        return keyPrefix;
    }

    if (item.items) {
        for (let j = 0; j < item.items.length; j++) {
            const child = item.items[j];
            const childKey = `${keyPrefix}-${j}`;
            const found = findInItem(child, childKey);
            if (found) return found;
        }
    }

    return null;
}

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
        // Ativa o item correspondente à rota atual (ou limpa se não houver match)
        const foundKey = findItemKeyForPath(currentPath);
        if (foundKey) {
            setActiveMenuItem(foundKey);
        } else {
            setActiveMenuItem(null);
        }
    }
);

onMounted(() => {
    const foundKey = findItemKeyForPath(route.path);
    if (foundKey) {
        setActiveMenuItem(foundKey);
    }
});
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
