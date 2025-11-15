<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    emit('update:modelValue', !props.modelValue);
};
</script>

<template>
    <button
        type="button"
        @click="toggle"
        :class="[
            'relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            modelValue ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-700'
        ]"
        :aria-pressed="modelValue"
    >
        <span :class="['inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform', modelValue ? 'translate-x-6' : 'translate-x-1']"></span>
    </button>
</template>

<style scoped>
button:focus-visible {
    outline: none;
}
</style>
