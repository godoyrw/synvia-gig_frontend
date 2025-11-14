import { defineStore } from 'pinia';

/**
 * Store global para diálogos reutilizáveis.
 * Usar quando for necessário abrir diálogos de qualquer parte da aplicação.
 */
export const useDialogStore = defineStore('dialog', {
    state: () => ({
        visible: false,
        payload: null
    }),

    actions: {
        open(payload = null) {
            this.payload = payload;
            this.visible = true;
        },

        close() {
            this.visible = false;
            this.payload = null;
        },

        toggle(payload = null) {
            this.visible = !this.visible;
            if (payload !== null) this.payload = payload;
        }
    }
});
