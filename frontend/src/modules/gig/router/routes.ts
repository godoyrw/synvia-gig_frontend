import type { RouteRecordRaw } from 'vue-router';

export const gigRoutes: RouteRecordRaw[] = [
    {
        path: '/gig',
        name: 'gig-root',
        component: () => import('@modules/gig/views/SynviaGig.vue'),
        meta: { title: 'GIG', icon: 'pi pi-table', permission: 'gig:view' }
    },
    {
        path: '/gig/import',
        name: 'gig-import',
        component: () => import('@modules/gig/views/import/ImportFilesView.vue'),
        meta: { title: 'Importar Arquivos', permission: 'gig:import' }
    },
    {
        path: '/gig/history',
        name: 'gig-history',
        component: () => import('@modules/gig/views/import/ImportHistoryView.vue'),
        meta: { title: 'Histórico', permission: 'gig:history' }
    }
];
