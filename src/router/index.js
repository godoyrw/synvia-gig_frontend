import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/synvia-gig' },
        {
          path: '/synvia-gig',
          name: 'synvia-gig',
          component: () => import('@/views/SynviaGig.vue')
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

  if (auth.isExpired) {
    auth.logout(true);
    return;
  }

  if (to.matched.some(r => r.meta?.requiresAuth) && !auth.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  const requiredRoles = to.matched
    .flatMap(r => r.meta?.roles || [])
    .filter(Boolean);

  if (requiredRoles.length) {
    const userRole = auth.user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return next({ name: 'accessDenied' });
    }
  }

  next();
});

export default router;
