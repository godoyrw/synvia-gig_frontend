<script setup>
import { useNotificationStore } from '@/stores/notifications';
import { computed } from 'vue';

const notificationStore = useNotificationStore();

const notifications = computed(() => notificationStore.notifications);

const getNotificationClasses = (notification) => {
    const baseClasses = 'fixed right-4 top-20 max-w-sm rounded-lg shadow-xl backdrop-blur-sm animate-slidedown transition-all duration-300 flex items-start gap-3 pl-16 pr-4 py-4 relative cursor-pointer hover:shadow-2xl';

    const typeClasses = {
        success: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
    };

    const closingClass = notification.isClosing ? 'animate-fadeout' : '';

    return `${baseClasses} ${typeClasses[notification.type]} ${closingClass}`;
};

const getIconBackgroundStyle = (type) => {
    const iconSymbols = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'ⓘ'
    };

    const colors = {
        success: 'rgb(22, 163, 74)',
        error: 'rgb(220, 38, 38)',
        warning: 'rgb(202, 138, 4)',
        info: 'rgb(37, 99, 235)'
    };

    const fontSize = {
        success: '18',
        error: '20',
        warning: '16',
        info: '18'
    };

    return {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(colors[type])}"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="${fontSize[type]}" font-family="system-ui" font-weight="bold">${iconSymbols[type]}</text></svg>')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        width: '34px',
        height: '34px',
        flexShrink: 0,
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)'
    };
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
    const baseClasses = 'text-xs';

    const typeClasses = {
        success: 'text-green-700 dark:text-green-300',
        error: 'text-red-700 dark:text-red-300',
        warning: 'text-yellow-700 dark:text-yellow-300',
        info: 'text-blue-700 dark:text-blue-300'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
};

const handleClose = (id) => {
    notificationStore.remove(id);
};
</script>

<template>
    <div class="fixed top-0 right-0 z-[9999] pointer-events-none w-full px-4 pt-4">
        <div class="flex justify-end">
            <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
                <div 
                    v-for="notification in notifications" 
                    :key="notification.id" 
                    :class="getNotificationClasses(notification)" 
                    class="pointer-events-auto w-full max-w-sm"
                    @click="handleClose(notification.id)"
                >
                    <!-- Ícone como background -->
                    <div :style="getIconBackgroundStyle(notification.type)"></div>

                    <!-- Conteúdo -->
                    <div class="flex-1">
                        <p v-if="notification.title" :class="getTitleClasses(notification)">
                            {{ notification.title }}
                        </p>
                        <p v-if="notification.message" :class="getMessageClasses(notification)">
                            {{ notification.message }}
                        </p>
                    </div>
                </div>
            </TransitionGroup>
        </div>
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
