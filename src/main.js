// src/main.js
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

import { useAuthStore } from '@/stores/auth';
import { $t } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

// Força dark-mode baseado no seletor configurado no PrimeVue
document.documentElement.classList.add('app-dark');

const app = createApp(App);

// 🔹 UM ÚNICO Pinia
const pinia = createPinia();
app.use(pinia);

// agora já podemos pegar a store
const auth = useAuthStore();

// checagem periódica (a cada 5 segundos só pra testar rápido)
setInterval(() => {
    auth.checkExpiration();
}, 5000);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

// 🔹 Aplica a paleta "synvia" como primary (global)
$t()
    .preset(Aura)
    .preset({
        semantic: {
            primary: {
                50: '#E8F5F5',
                100: '#C7E6E7',
                200: '#8BCBCD',
                300: '#52AEB0',
                400: '#2E9899',
                500: '#1A8384',
                600: '#146E6F',
                700: '#115C60',
                800: '#0D474A',
                900: '#083033',
                950: '#051F21'
            }
        }
    })
    .use({ useDefaultOptions: true });

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
