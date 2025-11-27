// src/main.js
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from '@core/router';

import { EXPIRATION_CHECK_INTERVAL_MS } from '@core/config/constants';
import { useAuthStore } from '@core/auth/store';
import { $t } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import 'primeicons/primeicons.css';

// Aplica preferência de tema persistida (default dark se não houver valor salvo)
try {
    const storedDark = localStorage.getItem('darkTheme');
    const useDark = storedDark ? storedDark === 'true' : true;
    if (useDark) {
        document.documentElement.classList.add('app-dark');
    } else {
        document.documentElement.classList.remove('app-dark');
    }
} catch (e) {
    // Se localStorage indisponível, mantém padrão dark
    document.documentElement.classList.add('app-dark');
}

const app = createApp(App);

// 🔹 UM ÚNICO Pinia
const pinia = createPinia();
app.use(pinia);

// agora já podemos pegar a store
const auth = useAuthStore();

// Inicia heartbeat se usuário já está autenticado (ex.: page refresh com token válido)
if (auth.isAuthenticated) {
    auth.startHeartbeat();
}

// checagem periódica de expiração
setInterval(() => {
    auth.checkExpiration();
}, EXPIRATION_CHECK_INTERVAL_MS);

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
