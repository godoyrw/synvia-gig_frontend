<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    if (props.disabled) {
        return;
    }
    emit('update:modelValue', !props.modelValue);
};
</script>

<template>
    <button
        type="button"
        @click="toggle"
        :class="[
            'relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            modelValue ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-700',
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        ]"
        :aria-pressed="modelValue"
        :disabled="disabled"
    >
        <span :class="['inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform', modelValue ? 'translate-x-6' : 'translate-x-1']"></span>
    </button>
</template>

<style scoped>
button:focus-visible {
    outline: none;
}
</style>
