<script setup>
import { useNotificationStore } from '@/stores/notifications';
import { computed } from 'vue';

const notificationStore = useNotificationStore();

const notifications = computed(() => notificationStore.notifications);

const getNotificationClasses = (notification) => {
    const baseClasses = 'fixed right-4 top-4 max-w-sm rounded-lg shadow-xl p-4 backdrop-blur-sm animate-slidedown transition-all duration-300 flex items-start gap-3';

    const typeClasses = {
        success: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
    };

    const closingClass = notification.isClosing ? 'animate-fadeout' : '';

    return `${baseClasses} ${typeClasses[notification.type]} ${closingClass}`;
};

const getIconClasses = (notification) => {
    const baseClasses = 'flex-shrink-0 text-lg mt-0.5';

    const typeClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
};

const getTitleClasses = (notification) => {
    const baseClasses = 'font-semibold text-sm';

    const typeClasses = {
        success: 'text-green-900 dark:text-green-200',
        error: 'text-red-900 dark:text-red-200',
        warning: 'text-yellow-900 dark:text-yellow-200',
        info: 'text-blue-900 dark:text-blue-200'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
};

const getMessageClasses = (notification) => {
    const baseClasses = 'text-xs mt-1';

    const typeClasses = {
        success: 'text-green-700 dark:text-green-300',
        error: 'text-red-700 dark:text-red-300',
        warning: 'text-yellow-700 dark:text-yellow-300',
        info: 'text-blue-700 dark:text-blue-300'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
};

const getCloseButtonClasses = (notification) => {
    const baseClasses = 'flex-shrink-0 text-lg cursor-pointer transition-opacity hover:opacity-70';

    const typeClasses = {
        success: 'text-green-400 dark:text-green-600',
        error: 'text-red-400 dark:text-red-600',
        warning: 'text-yellow-400 dark:text-yellow-600',
        info: 'text-blue-400 dark:text-blue-600'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
};

const handleClose = (id) => {
    notificationStore.remove(id);
};
</script>

<template>
    <div class="fixed top-4 right-4 z-50 pointer-events-none">
        <TransitionGroup name="list" tag="div">
            <div v-for="notification in notifications" :key="notification.id" :class="getNotificationClasses(notification)" class="pointer-events-auto">
                <!-- Ícone -->
                <div :class="getIconClasses(notification)" v-if="notification.icon">
                    <i :class="`pi ${notification.icon}`"></i>
                </div>

                <!-- Conteúdo -->
                <div class="flex-1">
                    <p v-if="notification.title" :class="getTitleClasses(notification)">
                        {{ notification.title }}
                    </p>
                    <p v-if="notification.message" :class="getMessageClasses(notification)">
                        {{ notification.message }}
                    </p>
                </div>

                <!-- Botão de fechar -->
                <button
                    @click="handleClose(notification.id)"
                    :class="getCloseButtonClasses(notification)"
                    class="flex-shrink-0 mt-0.5"
                    aria-label="Fechar notificação"
                >
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
/* Animação de entrada */
@keyframes slidedown {
    from {
        opacity: 0;
        transform: translateX(400px) rotateZ(5deg);
    }
    to {
        opacity: 1;
        transform: translateX(0) rotateZ(0deg);
    }
}

@keyframes fadeout {
    from {
        opacity: 1;
        transform: translateX(0) rotateZ(0deg);
    }
    to {
        opacity: 0;
        transform: translateX(400px) rotateZ(5deg);
    }
}

.animate-slidedown {
    animation: slidedown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-fadeout {
    animation: fadeout 0.3s cubic-bezier(0.4, 0, 1, 1);
}

/* Transição de lista */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.list-move {
    transition: transform 0.3s ease;
}
</style>
