// src/router/index.js
import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            meta: {
                requiresAuth: true
            },
            children: [
                { path: '', redirect: '/synvia-gig' },
                {
                    path: '/synvia-gig',
                    name: 'synvia-gig',
                    component: () => import('@/views/SynviaGig.vue')
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/pages/Profile.vue')
                },
                {
                    path: '/settings',
                    name: 'settings',
                    component: () => import('@/views/pages/Settings.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue'),
                    meta: {
                        permission: 'documentation:read'
                    }
                },
                {
                    path: '/synvia-gig/import-files',
                    name: 'importFiles',
                    component: () => import('@/views/import/ImportFilesView.vue'),
                    meta: {
                        requiresAuth: true
                    }
                }
            ]
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/forgot-password',
            name: 'forgotPassword',
            component: () => import('@/views/pages/auth/ForgotPassword.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'notFound',
            component: () => import('@/views/pages/NotFound.vue')
        }
    ]
});

// Guard global
router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    const now = Date.now();

    // 1️⃣ Se tiver expiração e já passou → logout + redirect
    if (auth.expiresAt && now >= auth.expiresAt) {
        auth.logout(true);
        return;
    }

    // 2️⃣ Se a rota exige auth e não está autenticado
    if (to.matched.some((r) => r.meta?.requiresAuth) && !auth.isAuthenticated) {
        return next({
            name: 'login',
            query: { redirect: to.fullPath }
        });
    }

    const requiredPermission = to.matched.map((record) => record.meta?.permission).find((permission) => !!permission);

    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
        return next({ name: 'accessDenied' });
    }

    next();
});

export default router;
