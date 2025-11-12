<script setup>
import { useAuthStore } from '@/stores/auth';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 👈 aqui

import SynviaLogoNegativo from '@/assets/images/logos/synvia_negativo.png';
import SynviaLogoPositivo from '@/assets/images/logos/synvia_positivo.png';

const email = ref('');
const password = ref('');
const checked = ref(false);
const isDarkTheme = false;

const router = useRouter();
const route  = useRoute();                            // 👈 e aqui
const auth = useAuthStore();

const handleLogin = async () => {
  try {
    await auth.loginWithCredentials(email.value, password.value);
    
    // 🔁 Usa o redirect da query, se existir; senão vai pra /synvia-gig
    const redirect = route.query.redirect || '/synvia-gig';
    router.push(redirect);

  } catch (err) {
    alert(err.message || 'Erro ao autenticar');
  }
};
</script>


<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img
                            :src="isDarkTheme ? SynviaLogoNegativo : SynviaLogoPositivo"
                            alt="SynviaLogo"
                            class="w-80 m-auto mb-8"
                        />
                        <span class="text-muted-color block font-medium">Autenticação de Usuário</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                        </div>
                        <Button label="Sign In" class="w-full" @click="handleLogin" />
                    </div>
                </div>
            </div>
        </div>
    </div>
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
