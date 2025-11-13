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

// 1) Cria UMA instância de Pinia e registra no app
const pinia = createPinia();
app.use(pinia);

// 2) Watchdog de expiração usando SEMPRE o store global
setInterval(() => {
    const auth = useAuthStore(); // pega sempre o mesmo store da instância global
    auth.checkExpiration();
}, 15000); // checa a cada 15s

// 3) Router + PrimeVue
app.use(router);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

// 4) Tema Synvia
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
