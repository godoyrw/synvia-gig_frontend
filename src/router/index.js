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
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
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

    next();
});

export default router;
