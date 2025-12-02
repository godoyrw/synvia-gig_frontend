import AppLayout from '@core/layout/AppLayout.vue';
import { useAuthStore } from '@core/auth/store';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { gigRoutes } from '@modules/gig/router/routes';

const moduleRoutes: RouteRecordRaw[] = [
    ...gigRoutes
];

const generalRoutes: RouteRecordRaw[] = [
    // pages gerais permanecem em src/views/pages e são carregadas aqui
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/pages/Profile.vue')
    },
    {
        path: '/users',
        name: 'users',
        component: () => import('@/views/users/UsersView.vue'),
        meta: { permission: 'users:*' }
    },
    {
        path: '/tenants',
        name: 'tenants',
        component: () => import('@/views/tenants/TenantsView.vue'),
        meta: { permission: 'tenants:*' }
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
        meta: { permission: 'documentation:read' }
    },
    {
        path: '/documentation/micro-services',
        name: 'documentationMicroServices',
        component: () => import('@/views/pages/DocumentationMicroServices.vue'),
        meta: { permission: 'documentation:read' }
    }
];

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/gig' },
            ...moduleRoutes,
            ...generalRoutes
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
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const auth = useAuthStore();
    const now = Date.now();

    if (auth.expiresAt && now >= auth.expiresAt) {
        auth.logout(true);
        return;
    }

    if (to.matched.some((r) => r.meta?.requiresAuth) && !auth.isAuthenticated) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    const requiredPermission = to.matched.map((record) => record.meta?.permission).find((p) => !!p);
    if (requiredPermission && !auth.hasPermission(requiredPermission as string)) {
        return next({ name: 'accessDenied' });
    }

    next();
});

export default router;
