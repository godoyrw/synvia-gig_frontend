<template>
    <div class="documentation-container">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-4xl font-bold mb-2 dark:text-surface-0">📋 Documentação</h1>
            <p class="text-surface-600 dark:text-surface-400">Guias, protocolos e referências técnicas</p>
        </div>

        <!-- Tabs/Navigation -->
        <div class="mb-6 flex gap-2 flex-wrap border-b border-surface-200 dark:border-surface-700">
            <button
                v-for="doc in docs"
                :key="doc.id"
                @click="currentDoc = doc.id"
                :class="[
                    'px-4 py-2 font-semibold transition-colors',
                    currentDoc === doc.id
                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                ]"
            >
                {{ doc.icon }} {{ doc.name }}
            </button>
        </div>

        <!-- Search -->
        <div class="mb-6">
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar na documentação..."
                class="w-full px-4 py-2 border rounded-lg bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-0"
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
import deploymentContent from '@/assets/docs/DEPLOYMENT_SETUP.md?raw';
import dialogContent from '@/assets/docs/DIALOG_SYSTEM.md?raw';
import logsContent from '@/assets/docs/LOGS_IMPLEMENTADOS.md?raw';
import notificationContent from '@/assets/docs/NOTIFICATION_SYSTEM.md?raw';
import sessionContent from '@/assets/docs/SYNVIA_SESSION_MANAGEMENT_REPORT.md?raw';
import { computed, ref } from 'vue';

const docs = [
    { id: 'logs', name: 'Implementações', icon: '📋' },
    { id: 'dialog', name: 'Dialogs', icon: '🗨️' },
    { id: 'notification', name: 'Notificações', icon: '🔔' },
    { id: 'deployment', name: 'Deploy', icon: '🚀' },
    { id: 'session', name: 'Sessão', icon: '👤' }
];

const currentDoc = ref('logs');
const searchQuery = ref('');

const markdownContents = {
    logs: logsContent,
    dialog: dialogContent,
    notification: notificationContent,
    deployment: deploymentContent,
    session: sessionContent
};

// Renderizar markdown em HTML
const renderMarkdown = (markdown) => {
    if (!markdown) return '';

    let html = markdown
        // Headings
        .replace(/^# (.*?)$/gm, '<h1 class="text-4xl font-bold my-4 mt-6 text-primary-600 dark:text-primary-400">$1</h1>')
        .replace(/^## (.*?)$/gm, '<h2 class="text-3xl font-bold my-3 mt-5 text-primary-700 dark:text-primary-300">$1</h2>')
        .replace(/^### (.*?)$/gm, '<h3 class="text-2xl font-bold my-2 mt-4 text-surface-800 dark:text-surface-200">$1</h3>')
        .replace(/^#### (.*?)$/gm, '<h4 class="text-xl font-semibold my-2 mt-3 text-surface-700 dark:text-surface-300">$1</h4>')
        
        // Code blocks
        .replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre class="bg-surface-800 dark:bg-surface-950 p-4 rounded my-2 overflow-x-auto"><code class="text-surface-100 font-mono text-sm">${escapeHtml(code.trim())}</code></pre>`;
        })
        
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded font-mono text-sm text-primary-600 dark:text-primary-400">$1</code>')
        
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-surface-900 dark:text-surface-100">$1</strong>')
        
        // Italic
        .replace(/\*([^*]+)\*/g, '<em class="italic text-surface-700 dark:text-surface-300">$1</em>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">$1</a>')
        
        // Horizontal lines
        .replace(/^---$/gm, '<hr class="my-3 border-surface-300 dark:border-surface-600" />')
        
        // Lists
        .replace(/^\- (.*?)$/gm, '<li class="ml-6 my-1">$1</li>')
        .replace(/^\d+\. (.*?)$/gm, '<li class="ml-6 my-1">$1</li>')
        
        // Paragraphs - Replace double newlines with <br>
        .replace(/\n\n+/g, '<br><br>')
        .replace(/^([^<].*?)$/gm, (match) => {
            if (!match.match(/^<|^\|/) && match.trim()) {
                return `<p class="my-4">${match}</p>`;
            }
            return match;
        });

    return html;
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const renderedMarkdown = computed(() => {
    const markdown = markdownContents[currentDoc.value] || '';
    let html = renderMarkdown(markdown);

    // Aplicar filtro de busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        const lines = html.split('\n');
        const filtered = lines.filter(line => line.toLowerCase().includes(query));
        html = filtered.join('\n');
    }

    return html;
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
    line-height: 1.8;
    word-break: break-word;

    :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
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

    :deep(ul), :deep(ol) {
        margin: 1rem 0;
    }

    :deep(code) {
        font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
        word-break: break-word;
    }

    :deep(pre) {
        overflow-x: auto;
        max-width: 100%;
        margin: 1.5rem 0;

        code {
            display: block;
            padding: 1rem;
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

        th, td {
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
}
</style>
