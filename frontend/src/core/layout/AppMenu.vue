<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@core/layout/composables/layout';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'APPs',
        items: [
            {
                label: 'SYNVIA - GIG',
                icon: 'pi pi-fw pi-home',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-chart-line',
                        to: '/gig'
                    },
                    {
                        label: 'Importações',
                        icon: 'pi pi-fw pi-upload',
                        to: '/gig/import'
                    },
                    {
                        label: 'Histórico de Importações',
                        icon: 'pi pi-fw pi-history',
                        to: '/gig/history'
                    },
                    {
                        label: 'Gestão de Processos',
                        icon: 'pi pi-fw pi-box',
                        to: '/gig/process'
                    }
                ]
            }
        ],
    },
    {
        label: 'Administração',
        items: [
            {
                label: 'Usuários',
                icon: 'pi pi-fw pi-users',
                to: '/users'
            },
            {
                label: 'Clientes',
                icon: 'pi pi-fw pi-building',
                to: '/tenants'
            }
        ]
    },
    {
        label: 'Desenvolvimento',
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
            const found = findInItem(item, baseKey, path);
            if (found) return found;
        }
    }

    return null;
};

function findInItem(item, keyPrefix, targetPath) {
    // Se o item tem um `to` e corresponde à rota, retorna a chave construída
    if (item.to && item.to === targetPath) {
        return keyPrefix;
    }

    if (item.items) {
        for (let j = 0; j < item.items.length; j++) {
            const child = item.items[j];
            const childKey = `${keyPrefix}-${j}`;
            const found = findInItem(child, childKey, targetPath);
            if (found) return found;
        }
    }

    return null;
}

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
