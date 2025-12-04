<script setup lang="ts">
import synviaGigLogo from '@/assets/images/logos/synvia_gig_positivo.png';

interface Props {
    title: string;
    subtitle: string;
    label?: string;
    logoSrc?: string;
    logoAlt?: string;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'SYNVIA GIG',
    logoSrc: synviaGigLogo,
    logoAlt: 'Synvia GIG'
});
</script>

<template>
    <div class="page-hero">
        <div>
            <p class="page-hero__label">{{ props.label }}</p>
            <h1 class="page-hero__title">{{ props.title }}</h1>
            <p class="page-hero__subtitle">{{ props.subtitle }}</p>
        </div>
         <img
            v-if="props.logoSrc"
            :src="props.logoSrc"
            :alt="props.logoAlt"
            class="page-hero__logo"
        />
    </div>
</template>

<style scoped>
.page-hero {
    background: var(--surface-card);
    border-radius: 1rem;
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.page-hero__label {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text-color);
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
}

.page-hero__title {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

.page-hero__subtitle {
    color: var(--text-color-secondary);
    max-width: 560px;
}

.page-hero__logo {
    width: 200px;
    max-width: 40vw;
}

@media (max-width: 768px) {
    .page-hero {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
    }

    .page-hero__logo {
        width: 150px;
    }
}
</style>
