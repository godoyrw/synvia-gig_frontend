// frontend/src/core/composables/useMultiSelectToggle.ts

import { computed, unref } from 'vue';

export function useMultiSelectToggle(selectedRef, optionsRef) {
    const allSelected = computed(() => {
        const selected = selectedRef.value ?? [];
        const options = unref(optionsRef) ?? [];
        return selected.length > 0 && selected.length === options.length;
    });

    function toggleAll() {
        const options = unref(optionsRef) ?? [];
        selectedRef.value = allSelected.value ? [] : options.map(o => o.value);
    }

    return { allSelected, toggleAll };
}
