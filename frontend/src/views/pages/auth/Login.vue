<script setup>
import { useAuthStore } from '@/stores/auth';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 👈 aqui

import backgroundLogin from '@/assets/images/backgrounds/background-login.jpg';
import SynviaLogoNegativo from '@/assets/images/logos/synvia_negativo.png';
import SynviaLogoPositivo from '@/assets/images/logos/synvia_positivo.png';
import NotificationCenter from '@/components/NotificationCenter.vue';
import ToggleSwitch from '@/components/ToggleSwitch.vue';
import { useNotifications } from '@/composables/useNotifications';

const email = ref('');
const password = ref('');
const checked = ref(false);
const isDarkTheme = false;
const passwordFieldRef = ref(null);

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { success, error, warning } = useNotifications();

const handleEmailKeydown = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        passwordFieldRef.value?.$el?.querySelector('input')?.focus();
    }
};

const handlePasswordKeydown = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleLogin();
    }
};

const handleLogin = async () => {
    // Validação de campos vazios
    if (!email.value?.trim()) {
        warning('Credencial de Usuário', 'Usuário em branco', 'Por favor, digite seu usuário/email');
        return;
    }

    if (!password.value?.trim()) {
        warning('Credencial de Usuário', 'Senha em branco', 'Por favor, digite sua senha');
        return;
    }

    try {
        await auth.loginWithCredentials(email.value, password.value);
        success('Credencial de Usuário', 'Login realizado com sucesso!');

        // 🔁 Usa o redirect da query, se existir; senão vai pra /synvia-gig
        const redirect = route.query.redirect || '/synvia-gig';
        router.push(redirect);
    } catch (err) {
        error(err.message || 'Erro ao autenticar');
    }
};

onMounted(() => {
    if (route.query.expired) {
        warning('Credencial de Usuário', 'Por segurança sua sessão expira em 05 minutos de inatividade. Faça login novamente.');
    }
});
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
                        <span class="text-muted-color block font-medium">Credencial de Usuário</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Usuário</label>
                        <InputText id="email1" type="text" placeholder="Digite o seu email" class="w-full md:w-[30rem] mb-8" v-model="email" @keydown="handleEmailKeydown" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Senha</label>
                        <Password id="password1" ref="passwordFieldRef" v-model="password" placeholder="Digite a sua senha" :toggleMask="true" class="mb-4" fluid :feedback="false" @keydown="handlePasswordKeydown"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center gap-3">
                                <ToggleSwitch v-model="checked" />
                                <label class="cursor-pointer text-surface-900 dark:text-surface-0">Lembrar-me</label>
                            </div>
                            <router-link to="/auth/forgot-password" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary hover:text-primary-600 transition-colors">Esqueceu a senha?</router-link>
                        </div>
                        <Button label="Entrar" class="w-full" @click="handleLogin" />
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
