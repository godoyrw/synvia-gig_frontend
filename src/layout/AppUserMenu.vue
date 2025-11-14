<script setup>
import { useAuthStore } from '@/stores/auth';
import { ref } from 'vue';

const auth = useAuthStore();
const showMenu = ref(false);

const handleLogout = () => {
    auth.logout(false);
    showMenu.value = false;
};
</script>

<template>
    <div class="relative">
        <!-- Ícone de Usuário -->
        <button type="button" class="layout-topbar-action" @click="showMenu = !showMenu" :aria-expanded="showMenu">
            <i class="pi pi-user"></i>
        </button>

        <!-- Menu Suspenso -->
        <Transition enter-active-class="animate-scalein" leave-active-class="animate-fadeout" @click-outside="showMenu = false">
            <div v-if="showMenu" class="absolute right-0 mt-2 w-48 bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg z-50 border border-surface-200 dark:border-surface-800">
                <!-- Informações do Usuário -->
                <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-800">
                    <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">
                        {{ auth.user?.displayName || 'Usuário' }}
                    </p>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                        {{ auth.user?.role || 'N/A' }}
                    </p>
                </div>

                <!-- Opções do Menu -->
                <div class="py-2">
                    <button type="button" class="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center gap-2">
                        <i class="pi pi-user text-sm"></i>
                        <span>Perfil</span>
                    </button>

                    <button type="button" class="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center gap-2">
                        <i class="pi pi-cog text-sm"></i>
                        <span>Configurações</span>
                    </button>
                </div>

                <!-- Divider -->
                <div class="border-t border-surface-200 dark:border-surface-800"></div>

                <!-- Logout -->
                <div class="py-2">
                    <button type="button" class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-2" @click="handleLogout">
                        <i class="pi pi-sign-out text-sm"></i>
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.animate-scalein {
    animation: scalein 0.15s linear;
}

.animate-fadeout {
    animation: fadeout 0.15s linear;
}

@keyframes scalein {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeout {
    from {
        opacity: 1;
        transform: scale(1);
    }
    to {
        opacity: 0;
        transform: scale(0.9);
    }
}
</style>
