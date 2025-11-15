<script setup>
import ToggleSwitch from '@/components/ToggleSwitch.vue';
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';

const { layoutConfig, toggleDarkMode } = useLayout();

const notificationSettings = ref({
    emailNotifications: true,
    pushNotifications: false,
    activityLog: true
});

const privacySettings = ref({
    dataSharing: false
});

const handleSaveNotifications = () => {
    // TODO: Chamar API para salvar notificações
    console.log('Notificações salvas:', notificationSettings.value);
};

const handleSavePrivacy = () => {
    // TODO: Chamar API para salvar privacidade
    console.log('Privacidade salva:', privacySettings.value);
};
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Configurações</h1>
                <p class="text-surface-600 dark:text-surface-400 mt-1">Personalize sua experiência</p>
            </div>

            <!-- Appearance Settings -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 sm:p-8 border border-surface-200 dark:border-surface-800 mb-6">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6 flex items-center gap-2">
                    <i class="pi pi-palette"></i>
                    <span>Aparência</span>
                </h2>

                <div class="space-y-6">
                    <!-- Theme Toggle -->
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Modo Escuro</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Alterne entre temas claro e escuro</p>
                        </div>
                        <button @click="toggleDarkMode" :class="['relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer', layoutConfig.darkTheme ? 'bg-primary-500' : 'bg-surface-300']">
                            <span :class="['inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform', layoutConfig.darkTheme ? 'translate-x-7' : 'translate-x-1']"></span>
                        </button>
                    </div>

                    <!-- Current Theme Info -->
                    <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                        <p class="text-sm text-surface-700 dark:text-surface-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            Tema atual: <span class="font-semibold">{{ layoutConfig.darkTheme ? 'Escuro' : 'Claro' }}</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Notification Settings -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 sm:p-8 border border-surface-200 dark:border-surface-800 mb-6">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6 flex items-center gap-2">
                    <i class="pi pi-bell"></i>
                    <span>Notificações</span>
                </h2>

                <div class="space-y-4">
                    <!-- Email Notifications -->
                    <div class="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-700">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Notificações por Email</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Receba alertas importantes por email</p>
                        </div>
                        <ToggleSwitch v-model="notificationSettings.emailNotifications" />
                    </div>

                    <!-- Push Notifications -->
                    <div class="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-700">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Notificações Push</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Receba notificações em tempo real</p>
                        </div>
                        <ToggleSwitch v-model="notificationSettings.pushNotifications" />
                    </div>

                    <!-- Activity Log -->
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Log de Atividades</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Monitore acessos e ações na conta</p>
                        </div>
                        <ToggleSwitch v-model="notificationSettings.activityLog" />
                    </div>
                </div>

                <button @click="handleSaveNotifications" class="mt-6 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                    <i class="pi pi-check text-sm"></i>
                    <span>Salvar Preferências</span>
                </button>
            </div>

            <!-- Privacy Settings -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 sm:p-8 border border-surface-200 dark:border-surface-800 mb-6">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6 flex items-center gap-2">
                    <i class="pi pi-lock"></i>
                    <span>Privacidade</span>
                </h2>

                <div class="space-y-6">
                    <!-- Data Sharing -->
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Compartilhamento de Dados</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Permitir análise de dados para melhorar serviços</p>
                        </div>
                        <ToggleSwitch v-model="privacySettings.dataSharing" />
                    </div>
                </div>

                <button @click="handleSavePrivacy" class="mt-6 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                    <i class="pi pi-check text-sm"></i>
                    <span>Salvar Privacidade</span>
                </button>
            </div>

            <!-- Danger Zone -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 sm:p-8 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <h2 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-6 flex items-center gap-2">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>Zona de Perigo</span>
                </h2>

                <p class="text-sm text-red-600 dark:text-red-300 mb-4">As ações nesta seção são irreversíveis. Proceda com cuidado.</p>

                <button type="button" class="px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                    <i class="pi pi-trash text-sm"></i>
                    <span>Deletar Conta</span>
                </button>
            </div>
        </div>
    </div>
</template>
