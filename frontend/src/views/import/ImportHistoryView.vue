<script setup lang="ts">
import PageHero from '@/components/PageHero.vue';
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import historyMock from '@/mock/data-files-history.json';
import { TOAST_DURATION, HISTORY_PAGE_SIZE } from '@/config/constants';

// Somente mock: sem chamadas à API nem tipos externos
const toast = useToast();

// Tipos locais baseados no mock
type ImportHistoryItem = {
    requestId: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    status: 'UPLOADED' | 'FAILED' | 'VALIDATION_ERROR';
    userId: number | string | null;
    displayName?: string;
    avatar?: string;
    clientId: number | string;
    fileName: string;
    fileSizeBytes: number;
    fileHash: string | null;
    durationMs: number | null;
    totalRows: number;
    errorRows: number;
};

type DecoratedHistoryItem = ImportHistoryItem & {
    userName: string;
    userAvatar: string; // string vazia -> Avatar com ícone
};

const isHistoryLoading = ref(false);
const historyFilter = ref<'ALL' | 'WARN' | 'ERROR'>('ALL');
const historyPage = ref(1);
const historySearch = ref('');
// Ordenação
const sortField = ref<string | null>(null);
const sortOrder = ref<1 | -1>(1); // 1 asc, -1 desc

// Normaliza o mock (timestamp ISO)
const mockHistoryItems = ((historyMock as { items?: ImportHistoryItem[] })?.items ?? []).map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp).toISOString()
}));

// Decora usando displayName/avatar do mock, com fallbacks
const decorateHistoryItem = (item: ImportHistoryItem): DecoratedHistoryItem => ({
    ...item,
    userName: item.displayName && item.displayName.trim() ? item.displayName : `Usuário #${String(item.userId ?? '—')}`,
    userAvatar: item.avatar && item.avatar.trim() ? item.avatar : ''
});

const historySearchTerm = computed(() => historySearch.value.trim().toLowerCase());

// 1) Filtra por nível (ALL / WARN / ERROR)
const historyFilteredByLevel = computed<ImportHistoryItem[]>(() => {
    if (historyFilter.value === 'ALL') return mockHistoryItems;
    return mockHistoryItems.filter((item) => item.level === historyFilter.value);
});

// 2) Aplica busca em cima do resultado filtrado
const historyItemsFiltered = computed<DecoratedHistoryItem[]>(() => {
    const term = historySearchTerm.value;

    const base = historyFilteredByLevel.value
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(decorateHistoryItem);

    if (!term) return base;

    return base.filter((item) => {
        const haystack = [item.fileName, item.userName, item.requestId, item.status, item.level].join(' ').toLowerCase();
        return haystack.includes(term);
    });
});

// Aplica ordenação custom antes de paginar
const historyItemsSorted = computed<DecoratedHistoryItem[]>(() => {
    const items = historyItemsFiltered.value.slice();
    if (!sortField.value) return items;
    return items.sort((a: any, b: any) => {
        const av = a[sortField.value];
        const bv = b[sortField.value];
        // Timestamp ordenar por Date
        if (sortField.value === 'timestamp') {
            const at = new Date(av).getTime();
            const bt = new Date(bv).getTime();
            return (at - bt) * sortOrder.value;
        }
        // Strings e numbers genéricos
        if (av == null && bv != null) return -1 * sortOrder.value;
        if (av != null && bv == null) return 1 * sortOrder.value;
        if (av == null && bv == null) return 0;
        const avStr = String(av).toLowerCase();
        const bvStr = String(bv).toLowerCase();
        if (avStr < bvStr) return -1 * sortOrder.value;
        if (avStr > bvStr) return 1 * sortOrder.value;
        return 0;
    });
});

// 3) Paginação em cima do filtro + busca
const historyPageItems = computed<DecoratedHistoryItem[]>(() => {
    const start = (historyPage.value - 1) * HISTORY_PAGE_SIZE;
    const end = start + HISTORY_PAGE_SIZE;
    return historyItemsSorted.value.slice(start, end);
});

// Contagens para resumo e paginação
const historyFilteredCount = computed(() => historyItemsFiltered.value.length);

const historySummaryLabel = computed(() => {
    const total = historyFilteredCount.value;

    if (!total) {
        return 'Nenhum registro encontrado';
    }

    const start = (historyPage.value - 1) * HISTORY_PAGE_SIZE + 1;
    const end = Math.min(historyPage.value * HISTORY_PAGE_SIZE, total);

    return `Exibindo ${start} a ${end} de ${total} registros`;
});

const statusTagSeverity = (level: ImportHistoryItem['level']) => {
    if (level === 'ERROR') return 'danger';
    if (level === 'WARN') return 'warning';
    return 'success';
};

const statusTagClass = (level: ImportHistoryItem['level']) => {
    if (level === 'WARN') return 'tag-warning';
    if (level === 'ERROR') return 'tag-error';
    return 'tag-success';
};

const statusTagLabel = (item: ImportHistoryItem) => {
    if (item.level === 'ERROR' || item.status === 'FAILED') return 'Erro';
    if (item.level === 'WARN' || item.status === 'VALIDATION_ERROR') return 'Aviso';
    return 'Enviado';
};

const formatKilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));

const setHistoryFilter = (filter: 'ALL' | 'WARN' | 'ERROR') => {
    historyFilter.value = filter;
    historyPage.value = 1;
};

const toggleSort = (field: string) => {
    if (sortField.value === field) {
        // Alterna ordem
        sortOrder.value = (sortOrder.value === 1 ? -1 : 1);
    } else {
        sortField.value = field;
        sortOrder.value = 1; // começa asc
    }
    historyPage.value = 1; // volta para primeira página ao ordenar
};

const sortIndicatorFor = (field: string) => {
    if (sortField.value !== field) return 'pi pi-sort-alt';
    return sortOrder.value === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
};

const handleHistoryPageChange = (event: { first: number; rows: number }) => {
    const newPage = Math.floor(event.first / event.rows) + 1;
    historyPage.value = newPage;
};

const handleRetryHistory = (item: ImportHistoryItem) => {
    if (item.errorRows === 0) return;
    toast.add({
        severity: 'info',
        summary: 'Reenvio',
        detail: 'Selecione novamente o CSV original na tela de importação para reenviar esta tentativa.',
        life: TOAST_DURATION.INFO
    });
};

const handleDeleteHistory = (item: ImportHistoryItem) => {
    console.log('Solicitar remoção de log', item.requestId);
    toast.add({
        severity: 'warn',
        summary: 'Deletar',
        detail: 'Fluxo de deleção será implementado em breve.',
        life: TOAST_DURATION.WARNING
    });
};

// Sempre que mudar a busca, volta para a página 1
watch(historySearchTerm, () => {
    historyPage.value = 1;
});
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero title="Histórico de Importações" subtitle="Visualize rapidamente todos os envios processados pelo serviço." />

        <Card class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
            <template #title>Histórico de importações</template>
            <template #content>
                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs uppercase tracking-wide text-surface-500">Status</span>
                        <div class="flex flex-wrap gap-2">
                            <Button
                                label="Todos"
                                size="small"
                                :outlined="historyFilter !== 'ALL'"
                                severity="secondary"
                                @click="setHistoryFilter('ALL')"
                            />
                            <Button
                                label="Avisos"
                                size="small"
                                icon="pi pi-exclamation-triangle"
                                :outlined="historyFilter !== 'WARN'"
                                severity="warning"
                                @click="setHistoryFilter('WARN')"
                            />
                            <Button
                                label="Erros"
                                size="small"
                                icon="pi pi-times-circle"
                                :outlined="historyFilter !== 'ERROR'"
                                severity="danger"
                                @click="setHistoryFilter('ERROR')"
                            />
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex flex-1 items-center gap-2 min-w-[240px]">
                            <span class="pi pi-search text-surface-400"></span>
                            <InputText
                                v-model="historySearch"
                                size="small"
                                class="flex-1 min-w-[200px] sm:w-72"
                                placeholder="Buscar por arquivo, usuário ou status"
                            />
                        </div>
                    </div>
                </div>

                <div class="history-table mt-4">
                    <DataTable :value="historyPageItems" size="small" :loading="isHistoryLoading" responsiveLayout="scroll">
                        <!-- COLUNA: ID -->
                        <Column style="width: 7%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'requestId' }]" @click="toggleSort('requestId')" aria-label="Ordenar por ID" :aria-sort="sortField === 'requestId' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                    <span class="title">ID</span>
                                    <i :class="['sort-icon', sortIndicatorFor('requestId')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <span class="font-mono text-sm text-surface-500">
                                    {{ data.requestId ?? '—' }}
                                </span>
                            </template>
                        </Column>

                        <Column style="width: 22%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'userName' }]" @click="toggleSort('userName')" aria-label="Ordenar por Usuário" :aria-sort="sortField === 'userName' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                    <span class="title">Usuário</span>
                                    <i :class="['sort-icon', sortIndicatorFor('userName')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <Avatar
                                        v-if="data.userAvatar !== ''"
                                        :image="data.userAvatar"
                                        size="large"
                                        shape="circle"
                                    />
                                    <Avatar
                                        v-else
                                        icon="pi pi-user"
                                        size="large"
                                        shape="circle"
                                    />
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">
                                            {{ data.userName }}
                                        </span>
                                        <small class="text-surface-500">ID: {{ data.userId ?? '—' }}</small>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column style="width: 26%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'fileName' }]" @click="toggleSort('fileName')" aria-label="Ordenar por Arquivo" :aria-sort="sortField === 'fileName' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                    <span class="title">Arquivo</span>
                                    <i :class="['sort-icon', sortIndicatorFor('fileName')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <div>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">
                                        {{ data.fileName }}
                                    </p>
                                    <small class="text-surface-500">
                                        {{ formatKilobytes(data.fileSizeBytes) }} · hash {{ data.fileHash ?? '—' }}
                                    </small>
                                </div>
                            </template>
                        </Column>

                        <Column style="width: 14%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'timestamp' }]" @click="toggleSort('timestamp')" aria-label="Ordenar por Data/Hora" :aria-sort="sortField === 'timestamp' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                    <span class="title">Data/Hora</span>
                                    <i :class="['sort-icon', sortIndicatorFor('timestamp')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <small class="block text-surface-700 dark:text-surface-300">
                                    {{ formatDateTime(data.timestamp) }}
                                </small>
                            </template>
                        </Column>

                        <Column header="Linhas" style="width: 14%">
                            <template #body="{ data }">
                                <div class="flex flex-col text-sm">
                                    <span class="text-surface-600 dark:text-surface-200">
                                        Total: {{ data.totalRows }}
                                    </span>
                                    <span class="text-orange-400">
                                        Erros: {{ data.errorRows }}
                                    </span>
                                </div>
                            </template>
                        </Column>

                        <Column header="Status" style="width: 12%">
                            <template #body="{ data }">
                                <Tag
                                    class="status-tag"
                                    :class="statusTagClass(data.level)"
                                    :value="statusTagLabel(data)"
                                    :severity="statusTagSeverity(data.level)"
                                />
                            </template>
                        </Column>

                        <Column header="Ações" style="width: 15%">
                            <template #body="{ data }">
                                <div class="flex flex-wrap gap-2">
                                    <Button
                                        label="Reenviar"
                                        size="small"
                                        icon="pi pi-refresh"
                                        :disabled="data.errorRows === 0"
                                        @click="handleRetryHistory(data)"
                                    />
                                    <Button
                                        label="Deletar"
                                        size="small"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        outlined
                                        @click="handleDeleteHistory(data)"
                                    />
                                </div>
                            </template>
                        </Column>

                        <template #empty>
                            <Message severity="info" :closable="false">
                                {{
                                    historySearchTerm
                                        ? 'Nenhum registro encontrado para esta busca.'
                                        : 'Nenhuma importação registrado para os filtros atuais.'
                                }}
                            </Message>
                        </template>
                    </DataTable>
                </div>

                <div class="mt-6 flex flex-col gap-2">
                    <Paginator
                        class="justify-center"
                        :rows="HISTORY_PAGE_SIZE"
                        :totalRecords="historyFilteredCount"
                        :first="(historyPage - 1) * HISTORY_PAGE_SIZE"
                        @page="handleHistoryPageChange"
                    />
                    <div class="history-summary text-right text-sm text-surface-500 md:ml-auto">
                        <i class="pi pi-database text-primary-400 mr-2"></i>
                        <span>{{ historySummaryLabel }}</span>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.history-table :deep(.p-datatable) {
    border-radius: 1rem;
    border: 1px solid var(--surface-200);
    overflow: hidden;
}

.history-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    font-size: 0.875rem;
    color: var(--surface-500);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.history-table :deep(.p-datatable-tbody > tr:nth-child(even)) {
    background: var(--surface-50);
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent);
}

.history-table :deep(.status-tag) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-radius: 999px;
    padding: 0.2rem 0.85rem;
    min-width: unset;
}

.history-table :deep(.tag-warning) {
    background-color: #fb923c !important;
    color: #111827 !important;
    border: none;
}

.history-table :deep(.tag-success) {
    background-color: #bbf7d0 !important;
    color: #065f46 !important;
    border: none;
}

.history-table :deep(.tag-error) {
    background-color: #fecaca !important;
    color: #7f1d1d !important;
    border: none;
}

.history-summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

/* Ordenação: botão flex com indicador à direita */
.sortable-header {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.4rem;
    background: transparent;
    border: none;
    padding: 0 0.25rem 0 0.4rem;
    font: inherit;
    cursor: pointer;
    color: var(--surface-600);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: color .15s ease;
}
.sortable-header .title { font-weight: 600; }
.sortable-header .sort-icon { font-size: .8rem; opacity:.85; }
.sortable-header:hover { color: var(--surface-800); }
.dark .sortable-header { color: var(--surface-400); }
.dark .sortable-header:hover { color: var(--surface-200); }
.sortable-header.active .sort-icon { opacity:1; }
</style>
