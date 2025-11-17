<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import backgroundLogin from '@/assets/images/backgrounds/background-login.jpg';
import SynviaLogoNegativo from '@/assets/images/logos/synvia_negativo.png';
import SynviaLogoPositivo from '@/assets/images/logos/synvia_positivo.png';
import NotificationCenter from '@/components/NotificationCenter.vue';
import { useNotifications } from '@/composables/useNotifications';

const email = ref('');
const verificationCode = ref('');
const isDarkTheme = false;
const step = ref('email'); // 'email' ou 'verify'

const router = useRouter();
const { success, error, warning, info } = useNotifications();

const isValidEmail = computed(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
});

const handleRequestCode = async () => {
    if (!email.value?.trim()) {
        warning('Email em branco', 'Por favor, digite seu email');
        return;
    }

    if (!isValidEmail.value) {
        warning('Email inválido', 'Por favor, digite um email válido');
        return;
    }

    try {
        // TODO: Chamar API para solicitar código de recuperação
        info('Código enviado', `Um código de verificação foi enviado para ${email.value}`);
        step.value = 'verify';
    } catch (err) {
        error(err.message || 'Erro ao solicitar código de recuperação');
    }
};

const handleVerifyCode = async () => {
    if (!verificationCode.value?.trim()) {
        warning('Código em branco', 'Por favor, digite o código de verificação');
        return;
    }

    try {
        // TODO: Chamar API para verificar código
        success('Senha recuperada com sucesso!');
        setTimeout(() => {
            router.push('/auth/login');
        }, 1500);
    } catch (err) {
        error(err.message || 'Erro ao verificar código');
    }
};

const handleBackToLogin = () => {
    router.push('/auth/login');
};
</script>

<template>
    <div class="flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden relative">
        <!-- Background com grayscale -->
        <div
            class="absolute inset-0"
            :style="{
                backgroundImage: `url(${backgroundLogin})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundAttachment: 'fixed',
                filter: 'grayscale(100%)',
                opacity: '0.4'
            }"
        ></div>

        <!-- Overlay com fundo preto semi-transparente -->
        <div class="absolute inset-0 bg-black/60"></div>

        <div class="flex flex-col items-center justify-center relative z-10">
            <div style="border-radius: 56px; padding: 0.3rem">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img :src="isDarkTheme ? SynviaLogoNegativo : SynviaLogoPositivo" alt="SynviaLogo" class="w-80 m-auto mb-8" />
                        <span class="text-muted-color block font-medium">{{ step === 'email' ? 'Recuperar Senha' : 'Verificar Código' }}</span>
                    </div>

                    <div>
                        <!-- Step 1: Email -->
                        <template v-if="step === 'email'">
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <div class="flex flex-col items-center">
                                <InputText id="email1" type="email" placeholder="Digite seu email" class="w-full md:w-[30rem] mb-8" v-model="email" />
                                <Button label="Enviar Código" class="w-full md:w-[30rem] mb-4" @click="handleRequestCode" />
                            </div>
                        </template>

                        <!-- Step 2: Verification Code -->
                        <template v-else>
                            <label for="code1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Código de Verificação</label>
                            <div class="flex flex-col items-center">
                                <InputText id="code1" type="text" placeholder="Digite o código" class="w-full md:w-[30rem] mb-8" v-model="verificationCode" />
                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-8 w-full md:w-[30rem]">
                                    Código enviado para: <span class="font-semibold">{{ email }}</span>
                                </p>
                                <Button label="Verificar Código" class="w-full md:w-[30rem] mb-4" @click="handleVerifyCode" />
                            </div>
                        </template>

                        <div class="flex flex-col items-center">
                            <Button label="Voltar ao Login" class="w-full md:w-[30rem] p-button-outlined" @click="handleBackToLogin" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <NotificationCenter />
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
