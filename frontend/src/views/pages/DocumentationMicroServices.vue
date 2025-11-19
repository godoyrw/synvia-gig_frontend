<script setup>
import deploymentContent from '@/assets/docs/deployment_setup.html?raw';
import importFilesContent from '@/assets/docs/import_files.html?raw';
import logsContent from '@/assets/docs/logs_implementados.html?raw';
import { computed, ref } from 'vue';

const DOCS = [
    { id: 'imports', name: 'Importações CSV', icon: '📤', content: importFilesContent },
    { id: 'deploy', name: 'Deployment', icon: '🚀', content: deploymentContent },
    { id: 'logs', name: 'Logs & Observabilidade', icon: '🧾', content: logsContent }
];

const currentDoc = ref(DOCS[0].id);
const searchQuery = ref('');

const sanitizeDocument = (html) => {
    if (!html) return '';

    let sanitized = html
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<\/?html[^>]*>/gi, '');

    const bodyMatch = sanitized.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch?.[1]) {
        sanitized = bodyMatch[1];
    }

    return sanitized.trim();
};

const highlightQuery = (html, query) => {
    if (!query) return html;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return html.replace(regex, '<mark>$1</mark>');
};

const renderedMarkdown = computed(() => {
    const doc = DOCS.find((item) => item.id === currentDoc.value);
    const sanitized = sanitizeDocument(doc?.content ?? '');
    return highlightQuery(sanitized, searchQuery.value.trim());
});

const docs = DOCS;
</script>

<template>
    <div class="documentation-container">
        <div class="mb-6">
            <h1 class="text-4xl font-bold mb-2 dark:text-surface-0">🛠️ Documentação — Micro Serviços</h1>
            <p class="text-surface-600 dark:text-surface-400">Arquitetura, fluxos e operação do backend Synvia GIG</p>
        </div>

        <div class="mb-6 flex gap-2 flex-wrap border-b border-surface-200 dark:border-surface-700">
            <button
                v-for="doc in docs"
                :key="doc.id"
                @click="currentDoc = doc.id"
                :class="[
                    'px-4 py-2 font-semibold transition-colors',
                    currentDoc === doc.id ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                ]"
            >
                {{ doc.icon }} {{ doc.name }}
            </button>
        </div>

        <div class="mb-6">
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar na documentação..."
                class="w-full px-4 py-2 border rounded-lg bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-0"
            />
        </div>

        <div class="markdown-content bg-surface-0 dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
            <div v-html="renderedMarkdown" class="prose dark:prose-invert max-w-none"></div>
        </div>

        <div class="mt-8 p-4 bg-primary-50 dark:bg-surface-800 rounded-lg border border-primary-200 dark:border-surface-700">
            <p class="text-sm text-surface-600 dark:text-surface-400"><strong>Última atualização:</strong> 18 de Novembro de 2025</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.documentation-container {
    padding: 1rem;

    @media (min-width: 768px) {
        padding: 2rem;
    }
}

.markdown-content {
    font-size: 1rem;
    line-height: 1.8;
    word-break: break-word;

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 0.5rem;
    }

    :deep(h1) {
        font-size: 2.25rem;
    }

    :deep(h2) {
        font-size: 1.875rem;
        border-bottom: 2px solid var(--surface-200);
        padding-bottom: 0.5rem;

        @media (prefers-color-scheme: dark) {
            border-color: var(--surface-700);
        }
    }

    :deep(h3) {
        font-size: 1.5rem;
    }

    :deep(h4) {
        font-size: 1.25rem;
    }

    :deep(p) {
        margin-bottom: 1rem;
        line-height: 1.8;
    }

    :deep(li) {
        margin-left: 1.5rem;
        margin-bottom: 0.5rem;
    }

    :deep(ul),
    :deep(ol) {
        margin: 1rem 0;
    }

    :deep(code) {
        font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Courier New', monospace;
        word-break: break-word;
        font-size: 0.95rem;
        border-radius: 0.35rem;
        background: color-mix(in srgb, var(--surface-200) 70%, transparent);
        padding: 0.15rem 0.35rem;
        color: var(--primary-700);

        @media (prefers-color-scheme: dark) {
            background: rgba(148, 163, 184, 0.12);
            color: #e0e7ff;
        }
    }

    :deep(pre) {
        position: relative;
        overflow-x: auto;
        max-width: 100%;
        margin: 1.5rem 0;
        padding: 0;
        border-radius: 1rem;
        background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), rgba(15, 23, 42, 0.95));
        border: 1px solid rgba(148, 163, 184, 0.15);
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.55;

        @media (prefers-color-scheme: light) {
            background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), rgba(15, 23, 42, 0.9));
        }

        &::before {
            content: '';
            position: absolute;
            top: 0.95rem;
            left: 1.15rem;
            width: 0.65rem;
            height: 0.65rem;
            border-radius: 999px;
            background: #ff5f56;
            box-shadow:
                1rem 0 0 0 #ffbd2e,
                2rem 0 0 0 #27c93f;
            opacity: 0.85;
        }

        &::after {
            content: '</> snippet';
            position: absolute;
            top: 0.65rem;
            right: 1.25rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(226, 232, 240, 0.65);
        }

        code {
            display: block;
            padding: 2.25rem 1.5rem 1.5rem;
            line-height: 1.5;
            letter-spacing: 0.01em;
            background: transparent;
            color: inherit;
            font-feature-settings:
                'liga' on,
                'calt' on;
            tab-size: 2;
        }

        &::-webkit-scrollbar {
            height: 10px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(226, 232, 240, 0.25);
            border-radius: 999px;
        }
    }

    :deep(a) {
        text-decoration: underline;
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
            opacity: 0.8;
        }
    }

    :deep(hr) {
        margin: 2rem 0;
    }

    :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;

        th {
            background-color: var(--primary-100);
            font-weight: 600;

            @media (prefers-color-scheme: dark) {
                background-color: var(--surface-800);
            }
        }

        th,
        td {
            padding: 0.75rem;
            border: 1px solid var(--surface-300);
            text-align: left;

            @media (prefers-color-scheme: dark) {
                border-color: var(--surface-700);
            }
        }

        tr:hover {
            background-color: var(--surface-50);

            @media (prefers-color-scheme: dark) {
                background-color: var(--surface-800);
            }
        }
    }

    :deep(blockquote) {
        border-left: 4px solid var(--primary-500);
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
    }

    :deep(strong) {
        font-weight: 700;
    }

    :deep(em) {
        font-style: italic;
    }

    :deep(mark) {
        background-color: var(--primary-100);
        color: var(--surface-900);
        padding: 0 0.25rem;
        border-radius: 0.25rem;

        @media (prefers-color-scheme: dark) {
            background-color: rgba(59, 130, 246, 0.25);
            color: var(--surface-0);
        }
    }
}
</style>
