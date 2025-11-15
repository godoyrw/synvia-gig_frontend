<template>
    <div class="documentation-container">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-4xl font-bold mb-2 dark:text-surface-0">📋 Implementações Realizadas</h1>
            <p class="text-surface-600 dark:text-surface-400">Histórico completo de features e desenvolvimento</p>
        </div>

        <!-- Search/Filter -->
        <div class="mb-6">
            <InputText 
                v-model="searchQuery" 
                placeholder="Buscar na documentação..."
                class="w-full"
            />
        </div>

        <!-- Content -->
        <div class="markdown-content bg-surface-0 dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
            <div v-html="renderedMarkdown" class="prose dark:prose-invert max-w-none"></div>
        </div>

        <!-- Footer -->
        <div class="mt-8 p-4 bg-primary-50 dark:bg-surface-800 rounded-lg border border-primary-200 dark:border-surface-700">
            <p class="text-sm text-surface-600 dark:text-surface-400">
                <strong>Última atualização:</strong> 15 de Novembro de 2025
            </p>
        </div>
    </div>
</template>

<script setup>
import InputText from 'primevue/inputtext';
import { computed, onMounted, ref } from 'vue';
import markdownContent from '../../assets/docs/LOGS_IMPLEMENTADOS.md?raw';

const searchQuery = ref('');

const renderedMarkdown = computed(() => {
    let html = markdownContent;

    // Converter heading 1
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold my-4 text-primary-600 dark:text-primary-400">$1</h1>');

    // Converter heading 2
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold my-3 text-primary-700 dark:text-primary-300 mt-6">$2</h2>');

    // Converter heading 3
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold my-2 text-surface-800 dark:text-surface-200">$3</h3>');

    // Converter heading 4
    html = html.replace(/^#### (.*?)$/gm, '<h4 class="text-lg font-semibold my-2 text-surface-700 dark:text-surface-300">$4</h4>');

    // Converter listas numeradas
    html = html.replace(/^\d+\. (.*?)$/gm, '<li class="ml-6 my-1">$1</li>');

    // Converter bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-surface-900 dark:text-surface-100">$1</strong>');

    // Converter italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-surface-700 dark:text-surface-300">$1</em>');

    // Converter código inline
    html = html.replace(/`(.*?)`/g, '<code class="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded font-mono text-sm text-primary-600 dark:text-primary-400">$1</code>');

    // Converter blocos de código
    html = html.replace(/```(.*?)```/gs, '<pre class="bg-surface-800 dark:bg-surface-950 p-4 rounded my-4 overflow-x-auto"><code class="text-surface-100 font-mono text-sm">$1</code></pre>');

    // Converter links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">$1</a>');

    // Converter linhas horizontais
    html = html.replace(/^---$/gm, '<hr class="my-6 border-surface-300 dark:border-surface-600" />');

    // Filtro de busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        const lines = html.split('<br>');
        const filtered = lines.filter(line => line.toLowerCase().includes(query));
        html = filtered.join('<br>');
    }

    return html;
});

onMounted(() => {
    console.log('[Documentation] 📖 Página de documentação carregada');
});
</script>

<style scoped lang="scss">
.documentation-container {
    padding: 1rem;

    @media (min-width: 768px) {
        padding: 2rem;
    }
}

.markdown-content {
    font-size: 1rem;
    line-height: 1.6;

    ::v-deep {
        h1, h2, h3, h4 {
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }

        p {
            margin-bottom: 1rem;
        }

        li {
            margin-left: 1.5rem;
            margin-bottom: 0.5rem;
        }

        code {
            font-family: 'Monaco', 'Courier New', monospace;
        }

        pre {
            overflow-x: auto;
            max-width: 100%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;

            th, td {
                padding: 0.75rem;
                border: 1px solid var(--surface-300);
                text-align: left;
            }

            thead {
                background-color: var(--primary-100);
            }

            @media (prefers-color-scheme: dark) {
                th, td {
                    border-color: var(--surface-700);
                }

                thead {
                    background-color: var(--surface-800);
                }
            }
        }
    }
}
</style>
