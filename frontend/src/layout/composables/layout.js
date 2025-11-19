import { computed, reactive } from 'vue';

// Recupera preferência de tema armazenada (se existir)
const storedDark = typeof window !== 'undefined' ? localStorage.getItem('darkTheme') : null;

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'synvia',
    surface: null,
    // Usa valor salvo ou mantém padrão (true = dark)
    darkTheme: storedDark ? storedDark === 'true' : true,
    menuMode: 'static'
});

// Aplica classe inicial se necessário
if (layoutConfig.darkTheme) {
    document.documentElement.classList.add('app-dark');
} else {
    document.documentElement.classList.remove('app-dark');
}

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

export function useLayout() {
    const setActiveMenuItem = (item) => {
        if (!item) {
            layoutState.activeMenuItem = null;
            return;
        }

        layoutState.activeMenuItem = item.value || item;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();

            return;
        }

        document.startViewTransition(() => executeDarkModeToggle(event));
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
        // Persistência
        try {
            localStorage.setItem('darkTheme', layoutConfig.darkTheme.toString());
        } catch (e) {
            // Fallback silencioso (ex: modo privado bloqueando localStorage)
            console.warn('[layout] Não foi possível persistir darkTheme:', e);
        }
    };

    const toggleMenu = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const closeMenu = () => {
        if (layoutState.overlayMenuActive) {
            layoutState.overlayMenuActive = false;
        }

        if (layoutState.staticMenuMobileActive) {
            layoutState.staticMenuMobileActive = false;
        }
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    const getPrimary = computed(() => layoutConfig.primary);

    const getSurface = computed(() => layoutConfig.surface);

    return {
        layoutConfig,
        layoutState,
        toggleMenu,
        closeMenu,
        isSidebarActive,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode
    };
}
