<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'SYNVIA - GIG',
        items: [
            {
                label: 'SYNVIA - GIG',
                icon: 'pi pi-fw pi-home',
                to: '/synvia-gig'
            },
            {
                label: 'Documentação',
                icon: 'pi pi-fw pi-book',
                to: '/documentation'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
