<script setup>
import PageHero from '@core/components/PageHero.vue';
import { useAuthStore } from '@core/auth/store';
import { ref } from 'vue';

const auth = useAuthStore();
const editMode = ref(false);
const formData = ref({
    displayName: auth.user?.displayName || '',
    role: auth.user?.role || '',
    email: auth.user?.username || ''
});

const handleEditToggle = () => {
    if (editMode.value) {
        editMode.value = false;
    } else {
        editMode.value = true;
    }
};

const handleSave = () => {
    // TODO: Chamar API para salvar dados
    editMode.value = false;
};

const handleCancel = () => {
    formData.value = {
        displayName: auth.user?.displayName || '',
        role: auth.user?.role || '',
        email: auth.user?.username || ''
    };
    editMode.value = false;
};
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero title="Meu Perfil" subtitle="Gerencie suas informações pessoais." />

        <div class="space-y-6">
            <!-- Profile Card -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 sm:p-8 border border-surface-200 dark:border-surface-800">
                <!-- Avatar Section -->
                <div class="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-surface-200 dark:border-surface-800">
                    <img v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user?.displayName" class="w-24 h-24 rounded-full object-cover border-4 border-primary-500" />
                    <div class="flex-1 text-center sm:text-left">
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ auth.user?.displayName }}
                        </h2>
                        <p class="text-surface-600 dark:text-surface-400 capitalize mt-1">
                            {{ auth.user?.role }}
                        </p>
                        <p class="text-surface-500 dark:text-surface-500 text-sm mt-2">
                            {{ auth.user?.username }}
                        </p>
                    </div>
                    <button v-if="!editMode" type="button" @click="handleEditToggle" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                        <i class="pi pi-pencil text-sm"></i>
                        <span>Editar</span>
                    </button>
                </div>

                <!-- Information Section -->
                <div class="space-y-6">
                    <!-- Name Field -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Nome </label>
                        <input
                            v-if="editMode"
                            v-model="formData.displayName"
                            type="text"
                            class="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                        />
                        <p v-else class="text-surface-900 dark:text-surface-0">
                            {{ formData.displayName }}
                        </p>
                    </div>

                    <!-- Role Field -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Função </label>
                        <input
                            v-if="editMode"
                            v-model="formData.role"
                            type="text"
                            disabled
                            class="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 cursor-not-allowed"
                        />
                        <p v-else class="capitalize text-surface-900 dark:text-surface-0">
                            {{ formData.role }}
                        </p>
                    </div>

                    <!-- Email Field -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Email </label>
                        <input
                            v-if="editMode"
                            v-model="formData.email"
                            type="email"
                            disabled
                            class="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 cursor-not-allowed"
                        />
                        <p v-else class="text-surface-900 dark:text-surface-0">
                            {{ formData.email }}
                        </p>
                    </div>

                    <!-- Member Since -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Membro desde </label>
                        <p class="text-surface-600 dark:text-surface-400">
                            {{ new Date().toLocaleDateString('pt-BR') }}
                        </p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 mt-8 pt-8 border-t border-surface-200 dark:border-surface-800">
                    <button v-if="editMode" type="button" @click="handleSave" class="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2">
                        <i class="pi pi-check text-sm"></i>
                        <span>Salvar</span>
                    </button>
                    <button
                        v-if="editMode"
                        type="button"
                        @click="handleCancel"
                        class="flex-1 px-4 py-2 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-900 dark:text-surface-0 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                        <i class="pi pi-times text-sm"></i>
                        <span>Cancelar</span>
                    </button>
                </div>
            </div>

            <!-- Additional Info Card -->
            <div class="mt-6 bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg p-6 border border-surface-200 dark:border-surface-800">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Segurança</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">Alterar Senha</p>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Atualize sua senha regularmente</p>
                        </div>
                        <button type="button" class="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors cursor-pointer">Alterar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
