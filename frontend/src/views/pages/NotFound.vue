<script setup>
import SynviaLogoNegativo from '@/assets/images/logos/synvia_negativo.png';
import SynviaLogoPositivo from '@/assets/images/logos/synvia_positivo.png';
import { useLayout } from '@core/layout/composables/layout';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const { isDarkTheme } = useLayout();
const toast = useToast();

const goHome = () => {
    toast.add({ severity: 'info', summary: 'Redirecionando', detail: 'Voltando ao dashboard...', life: 4000 });
    router.push('/auth/login');
};

const goLogin = () => {
    toast.add({ severity: 'info', summary: 'Redirecionando', detail: 'Voltando ao login...', life: 4000 });
    router.push('/auth/login');
};
</script>

<template>
    <div class="flex items-center justify-center min-h-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <!-- Logo -->
            <img :src="isDarkTheme ? SynviaLogoPositivo : SynviaLogoNegativo" alt="SynviaLogo" class="mb-12 h-32 object-contain" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                    <h1 class="surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">404 Not Found</h1>

                    <!-- 404 Image -->
                    <img src="@/assets/images/illustrations/404.png" alt="404 Not Found" class="w-full max-w-md h-auto mb-8" />

                    <button @click="goHome" class="w-full mt-4 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer font-medium">
                        <i class="pi pi-home mr-2"></i>
                        <span>Ir para Dashboard</span>
                    </button>
                    <button @click="goLogin" class="w-full mt-2 px-6 py-3 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors cursor-pointer font-medium">
                        <i class="pi pi-sign-in mr-2"></i>
                        <span>Voltar ao Login</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
