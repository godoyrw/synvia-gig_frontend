<script setup lang="ts">
import PageHero from '@/components/PageHero.vue';
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { TOAST_DURATION, HISTORY_PAGE_SIZE } from '@/config/constants';
import { useImportHistoryStore } from '@/stores/importHistory';
import FloatLabel from 'primevue/floatlabel';

// Somente mock: sem chamadas à API nem tipos externos
const toast = useToast();

// Tipos locais baseados no mock
type ImportHistoryItem = {
    requestId: number | string;
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
    statusLabel: string; // 'Erro' | 'Aviso' | 'Enviado'
};

const isHistoryLoading = ref(false);
// Removido filtro por nível/status (ALL/WARN/ERROR) conforme solicitação
const historyPage = ref(1);
// Page size dinâmico com persistência (fallback para constante padrão)
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100].map(v => ({ label: String(v), value: v }));
const historyPageSize = ref<number>(Number(localStorage.getItem('historyPageSize')) || HISTORY_PAGE_SIZE);
watch(historyPageSize, (val) => {
    localStorage.setItem('historyPageSize', String(val));
    historyPage.value = 1;
});
const historySearch = ref('');
// Ordenação
const sortField = ref<string | null>(null);
const sortOrder = ref<1 | -1>(1); // 1 asc, -1 desc

// Filtros (usuário / arquivo)
const userFilterSelected = ref<string[]>([]);
const fileFilterSelected = ref<string[]>([]);
// Status tags filter
const statusFilterSelected = ref<string[]>([]); // 'Erro' | 'Aviso' | 'Enviado'
const statusFilterPanel = ref();
const toggleStatusFilterPanel = (e: Event) => statusFilterPanel.value?.toggle(e);
const userFilterPanel = ref();
const fileFilterPanel = ref();
const toggleUserFilterPanel = (e: Event) => userFilterPanel.value?.toggle(e);
const toggleFileFilterPanel = (e: Event) => fileFilterPanel.value?.toggle(e);

// Operadores dos filtros
type StringFilterMode = 'startsWith' | 'contains' | 'notContains' | 'endsWith' | 'equals' | 'notEquals';
const userFilterMode = ref<StringFilterMode>('contains');
const fileFilterMode = ref<StringFilterMode>('contains');
const FILTER_MODES = [
    { label: 'Começa com', value: 'startsWith' },
    { label: 'Contém', value: 'contains' },
    { label: 'Não contém', value: 'notContains' },
    { label: 'Termina com', value: 'endsWith' },
    { label: 'Igual a', value: 'equals' },
    { label: 'Diferente de', value: 'notEquals' },
];

// Campo de digitação manual para adicionar valores que não existem nas opções
const userFilterManual = ref('');
const fileFilterManual = ref('');
const addUserManual = () => {
    const v = userFilterManual.value.trim();
    if (v && !userFilterSelected.value.includes(v)) {
        userFilterSelected.value.push(v);
    }
    userFilterManual.value = '';
};
const addFileManual = () => {
    const v = fileFilterManual.value.trim();
    if (v && !fileFilterSelected.value.includes(v)) {
        fileFilterSelected.value.push(v);
    }
    fileFilterManual.value = '';
};

// Distinct status labels derivados do mock
const importHistoryStore = useImportHistoryStore();
const historySourceItems = computed<ImportHistoryItem[]>(() =>
    importHistoryStore.items.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp).toISOString()
    }))
);

const distinctStatusLabels = computed(() => {
    const set = new Set<string>();
    historySourceItems.value.forEach((raw) => set.add(statusTagLabel(raw)));
    return Array.from(set.values()).map((lbl) => ({ label: lbl, value: lbl }));
});

// Decora usando displayName/avatar do mock, com fallbacks
const decorateHistoryItem = (item: ImportHistoryItem): DecoratedHistoryItem => ({
    ...item,
    userName: item.displayName && item.displayName.trim() ? item.displayName : `Usuário #${String(item.userId ?? '—')}`,
    userAvatar: item.avatar && item.avatar.trim() ? item.avatar : '',
    statusLabel: statusTagLabel(item)
});

const historySearchTerm = computed(() => historySearch.value.trim().toLowerCase());

// 1) (Anteriormente filtrava por nível) agora retorna direto os itens
const historyFilteredByLevel = computed<ImportHistoryItem[]>(() => historySourceItems.value);

// 2) Aplica busca em cima do resultado filtrado
const historyItemsFiltered = computed<DecoratedHistoryItem[]>(() => {
    const term = historySearchTerm.value;
    let base = historyFilteredByLevel.value
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(decorateHistoryItem);

    const applyStringMode = (value: string, selected: string[], manual: string, mode: StringFilterMode) => {
        const effective = manual ? [...selected, manual] : selected;
        if (!effective.length) return true;
        const v = value.toLowerCase();
        const lowered = effective.map((s) => s.toLowerCase());
        switch (mode) {
            case 'startsWith':
                return lowered.some((s) => v.startsWith(s));
            case 'contains':
                return lowered.some((s) => v.includes(s));
            case 'notContains':
                return lowered.every((s) => !v.includes(s));
            case 'endsWith':
                return lowered.some((s) => v.endsWith(s));
            case 'equals':
                return lowered.some((s) => v === s);
            case 'notEquals':
                return lowered.every((s) => v !== s);
            default:
                return true;
        }
    };

    // Filtro de usuários (aplica operador + valor manual)
    base = base.filter((item) => applyStringMode(item.userName, userFilterSelected.value, userFilterManual.value.trim(), userFilterMode.value));
    // Filtro de arquivos (aplica operador + valor manual)
    base = base.filter((item) => applyStringMode(item.fileName, fileFilterSelected.value, fileFilterManual.value.trim(), fileFilterMode.value));
    // Filtro de status tags (seleção simples sem operadores)
    if (statusFilterSelected.value.length) {
        const setStatus = new Set(statusFilterSelected.value);
        base = base.filter((item) => setStatus.has(item.statusLabel));
    }

    if (!term) return base;

    return base.filter((item) => {
        // Busca: statusLabel em PT-BR + data/hora formatada (também em PT-BR) + demais campos principais
        const dateLabel = formatDateTime(item.timestamp).toLowerCase();
        const haystack = [item.fileName, item.userName, item.requestId, item.statusLabel, dateLabel]
            .join(' ')
            .toLowerCase();
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
    const size = historyPageSize.value;
    const start = (historyPage.value - 1) * size;
    const end = start + size;
    return historyItemsSorted.value.slice(start, end);
});

// Contagens para resumo e paginação
const historyFilteredCount = computed(() => historyItemsFiltered.value.length);

const historySummaryLabel = computed(() => {
    const total = historyFilteredCount.value;
    if (!total) return 'Nenhum registro encontrado';
    const size = historyPageSize.value;
    const start = (historyPage.value - 1) * size + 1;
    const end = Math.min(historyPage.value * size, total);
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

// Função de setHistoryFilter removida (não utilizada)

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

// Volta para página 1 ao alterar filtros
watch([userFilterSelected, fileFilterSelected, userFilterMode, fileFilterMode, userFilterManual, fileFilterManual, statusFilterSelected], () => {
    historyPage.value = 1;
});

// Opções distintas (derivam do mock filtrado por nível, antes de aplicar filtros de usuário/arquivo)
const distinctUsers = computed(() => {
    const map = new Map<string, DecoratedHistoryItem>();
    historyFilteredByLevel.value.forEach((raw) => {
        const decorated = decorateHistoryItem(raw);
        if (!map.has(decorated.userName)) map.set(decorated.userName, decorated);
    });
    return Array.from(map.values()).map((item) => ({ label: item.userName, value: item.userName, avatar: item.userAvatar }));
});
const distinctFiles = computed(() => {
    const set = new Set<string>();
    historyFilteredByLevel.value.forEach((raw) => set.add(raw.fileName));
    return Array.from(set.values()).map((file) => ({ label: file, value: file }));
});
const clearUserFilter = () => {
    userFilterSelected.value = [];
    userFilterMode.value = 'contains';
    userFilterManual.value = '';
};
const clearFileFilter = () => {
    fileFilterSelected.value = [];
    fileFilterMode.value = 'contains';
    fileFilterManual.value = '';
};
const clearStatusFilter = () => { statusFilterSelected.value = []; };

// Overlay Menus por linha (armazenamos referências para abrir/fechar)
const actionsMenus = ref<Record<string, any>>({});
const setActionsMenuRef = (el: any, id: string) => {
    if (el) actionsMenus.value[id] = el;
};
const toggleRowMenu = (event: Event, id: string) => {
    const menu = actionsMenus.value[id];
    if (menu) menu.toggle(event);
};
const buildActionsModel = (item: DecoratedHistoryItem) => [
    {
        label: 'Reenviar',
        icon: 'pi pi-refresh',
        disabled: item.errorRows === 0,
        command: () => handleRetryHistory(item)
    },
    {
        label: 'Deletar',
        icon: 'pi pi-trash',
        command: () => handleDeleteHistory(item)
    }
];
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero title="Histórico de Importações" subtitle="Visualize rapidamente todos os envios processados pelo serviço." />

        <Card class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
            <template #title>Importações Gerais</template>
            <template #content>
                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-center justify-end gap-3 search-bar-wrapper">
                        <div class="p-input-icon-left search-input">
                            <i class="pi pi-search"></i>
                            <InputText
                                v-model="historySearch"
                                size="small"
                                class="w-64"
                                placeholder="Palavra(s) chave..."
                            />
                        </div>
                    </div>
                </div>

                <div class="history-table mt-4">
                    <DataTable :value="historyPageItems" size="small" :loading="isHistoryLoading" responsiveLayout="scroll">
                        <!-- COLUNA: ID -->
                        <Column style="width: 5%">
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

                        <Column style="width: 20%">
                            <template #header>
                                <div class="header-with-filter">
                                    <button type="button" :class="['sortable-header', { active: sortField === 'userName' }]" @click="toggleSort('userName')" aria-label="Ordenar por Usuário" :aria-sort="sortField === 'userName' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                        <span class="title">Usuário</span>
                                        <i :class="['sort-icon', sortIndicatorFor('userName')]" />
                                    </button>
                                    <button type="button" class="filter-trigger" aria-label="Filtrar Usuários" @click="toggleUserFilterPanel($event)">
                                        <i class="pi pi-filter" />
                                    </button>
                                </div>
                                <OverlayPanel ref="userFilterPanel" style="min-width:18rem" class="filter-panel">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Usuários</span>
                                        <Button label="Limpar" size="small" text @click="clearUserFilter" />
                                    </div>
                                    <div class="flex flex-col gap-3">
                                        <Dropdown v-model="userFilterMode" :options="FILTER_MODES" optionLabel="label" optionValue="value" class="w-full" />
                                        <div class="flex gap-2">
                                            <InputText v-model="userFilterManual" placeholder="Digitar valor" class="flex-1" @keyup.enter="addUserManual" />
                                            <Button icon="pi pi-plus" severity="secondary" @click="addUserManual" rounded outlined aria-label="Adicionar valor manual" />
                                        </div>
                                        <MultiSelect
                                            v-model="userFilterSelected"
                                            :options="distinctUsers"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Qualquer"
                                            display="chip"
                                            class="w-full"
                                        >
                                            <template #option="{ option }">
                                                <div class="flex items-center gap-2">
                                                    <Avatar v-if="option.avatar" :image="option.avatar" shape="circle" size="small" />
                                                    <Avatar v-else icon="pi pi-user" shape="circle" size="small" />
                                                    <span>{{ option.label }}</span>
                                                </div>
                                            </template>
                                        </MultiSelect>
                                    </div>
                                </OverlayPanel>
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

                        <Column style="width: 40%">
                            <template #header>
                                <div class="header-with-filter">
                                    <button type="button" :class="['sortable-header', { active: sortField === 'fileName' }]" @click="toggleSort('fileName')" aria-label="Ordenar por Arquivo" :aria-sort="sortField === 'fileName' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                        <span class="title">Arquivo</span>
                                        <i :class="['sort-icon', sortIndicatorFor('fileName')]" />
                                    </button>
                                    <button type="button" class="filter-trigger" aria-label="Filtrar Arquivos" @click="toggleFileFilterPanel($event)">
                                        <i class="pi pi-filter" />
                                    </button>
                                </div>
                                <OverlayPanel ref="fileFilterPanel" style="min-width:18rem" class="filter-panel">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Arquivos</span>
                                        <Button label="Limpar" size="small" text @click="clearFileFilter" />
                                    </div>
                                    <div class="flex flex-col gap-3">
                                        <Dropdown v-model="fileFilterMode" :options="FILTER_MODES" optionLabel="label" optionValue="value" class="w-full" />
                                        <div class="flex gap-2">
                                            <InputText v-model="fileFilterManual" placeholder="Digitar valor" class="flex-1" @keyup.enter="addFileManual" />
                                            <Button icon="pi pi-plus" severity="secondary" @click="addFileManual" rounded outlined aria-label="Adicionar valor manual" />
                                        </div>
                                        <MultiSelect
                                            v-model="fileFilterSelected"
                                            :options="distinctFiles"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Qualquer"
                                            class="w-full"
                                            display="chip"
                                        />
                                    </div>
                                </OverlayPanel>
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

                        <Column style="width: 10%">
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

                        <Column header="Linhas" style="width: 10%">
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

                        <Column style="width: 10%">
                            <template #header>
                                <div class="header-with-filter">
                                    <button type="button"
                                            :class="['sortable-header', { active: sortField === 'statusLabel' }]"
                                            @click="toggleSort('statusLabel')"
                                            aria-label="Ordenar por Status"
                                            :aria-sort="sortField === 'statusLabel' ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'">
                                        <span class="title">Status</span>
                                        <i :class="['sort-icon', sortIndicatorFor('statusLabel')]" />
                                    </button>
                                    <button type="button" class="filter-trigger" aria-label="Filtrar Status" @click="toggleStatusFilterPanel($event)">
                                        <i class="pi pi-filter" />
                                    </button>
                                </div>
                                <OverlayPanel ref="statusFilterPanel" style="min-width:14rem" class="filter-panel">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Status</span>
                                        <Button label="Limpar" size="small" text @click="clearStatusFilter" />
                                    </div>
                                    <MultiSelect
                                        v-model="statusFilterSelected"
                                        :options="distinctStatusLabels"
                                        optionLabel="label"
                                        optionValue="value"
                                        display="chip"
                                        placeholder="Qualquer"
                                        class="w-full"
                                    >
                                        <template #option="{ option }">
                                            <Tag :value="option.label" :class="['status-option-tag',
                                                option.label==='Erro' ? 'tag-error' : option.label==='Aviso' ? 'tag-warning' : 'tag-success']" />
                                        </template>
                                        <template #chip="{ value }">
                                            <Tag :value="value" :class="['status-chip-tag',
                                                value==='Erro' ? 'tag-error' : value==='Aviso' ? 'tag-warning' : 'tag-success']" />
                                        </template>
                                    </MultiSelect>
                                </OverlayPanel>
                            </template>
                            <template #body="{ data }">
                                <Tag
                                    class="status-tag"
                                    :class="statusTagClass(data.level)"
                                    :value="data.statusLabel"
                                    :severity="statusTagSeverity(data.level)"
                                />
                            </template>
                        </Column>

<<<<<<< Updated upstream
                        <Column header="Ações" style="width: 5%; text-align:center;">
||||||| Stash base
                        <Column header="Ações" style="width: 5%; text-align: center">
=======
<<<<<<< HEAD
                        <Column header="Ações" style="width: 5%; text-align: center">
||||||| parent of b15b685 (Dev import files (#47))
                        <Column header="Ações" style="width: 3%; text-align:center;">
=======
                        <Column header="Ações" style="width: 5%; text-align:center;">
>>>>>>> b15b685 (Dev import files (#47))
>>>>>>> Stashed changes
                            <template #body="{ data }">
                                <div class="actions-menu-wrapper">
                                    <Button
                                        aria-label="Ações"
                                        icon="pi pi-ellipsis-v"
                                        class="p-button-rounded p-button-text actions-trigger"
                                        @click="toggleRowMenu($event, data.requestId)"
                                    />
                                    <Menu
                                        :ref="el => setActionsMenuRef(el, data.requestId)"
                                        :model="buildActionsModel(data)"
                                        popup
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

                <div class="mt-6 history-pagination-grid">
                    <div class="page-size-col">
                        <FloatLabel class="w-full page-size-float" variant="on">
                            <Dropdown v-model="historyPageSize" inputId="historyPageSize" :options="PAGE_SIZE_OPTIONS" optionLabel="label" optionValue="value" class="w-full" />
                            <label for="historyPageSize">Linhas</label>
                        </FloatLabel>
                    </div>
                    <div class="paginator-col">
                        <div class="paginator-wrapper">
                            <Paginator
                                :rows="historyPageSize"
                                :totalRecords="historyFilteredCount"
                                :first="(historyPage - 1) * historyPageSize"
                                @page="handleHistoryPageChange"
                            />
                        </div>
                    </div>
                    <div class="summary-col">
                        <div class="history-summary text-sm text-surface-500">
                            <i class="pi pi-database text-primary-400 mr-2"></i>
                            <span>{{ historySummaryLabel }}</span>
                        </div>
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

.history-table :deep(.p-datatable-tbody > tr:nth-child(odd)) {
    /* Zebra (tema claro) - opacidade um pouco maior para melhor contraste */
    background: rgba(0, 0, 0, 0.03);
}

:root[class*='app-dark'] .history-table :deep(.p-datatable-tbody > tr:nth-child(odd)) {
    /* Zebra sutil para tema escuro */
    background: rgba(255, 255, 255, 0.05);
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

/* Ações: garantir mesma largura para ambos os botões */
.history-table :deep(.actions-menu-wrapper) { display:flex; justify-content:center; }
.history-table :deep(.actions-trigger) {
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid var(--surface-300);
    background: var(--surface-100);
    color: var(--surface-700);
    transition: background .15s ease, color .15s ease;
}
:root[class*='app-dark'] .history-table :deep(.actions-trigger) {
    background: var(--surface-800);
    border-color: var(--surface-700);
    color: var(--surface-200);
}
.history-table :deep(.actions-trigger:hover) { background: var(--surface-200); color: var(--surface-900); }
:root[class*='app-dark'] .history-table :deep(.actions-trigger:hover) { background: var(--surface-700); color: var(--surface-50); }

/* Filtros */
.header-with-filter { display:flex; align-items:center; gap:.25rem; }
.filter-trigger {
    background: transparent;
    border: 1px solid var(--surface-300);
    color: var(--surface-600);
    width: 1.9rem;
    height: 1.9rem;
    display: inline-flex;
    align-items:center;
    justify-content:center;
    border-radius: .5rem;
    cursor: pointer;
    transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.filter-trigger:hover { background: var(--surface-200); color: var(--surface-800); }
:root[class*='app-dark'] .filter-trigger { border-color: var(--surface-700); color: var(--surface-300); }
:root[class*='app-dark'] .filter-trigger:hover { background: var(--surface-700); color: var(--surface-50); }
.filter-panel :deep(.p-multiselect-token) { font-size:.65rem; }
.filter-panel :deep(.p-dropdown) { font-size:.75rem; }
.filter-panel :deep(.p-dropdown-label) { padding:.5rem .75rem; }
.filter-panel :deep(.p-inputtext) { font-size:.75rem; }

/* FloatLabel page size */
.page-size-float :deep(.p-dropdown) { font-size:.75rem; }
.page-size-float :deep(.p-dropdown-label) { padding:.5rem .75rem; }
.page-size-float :deep(.p-floatlabel) { width:100%; }
.page-size-float { max-width:14rem; }

/* Grid paginação */
.history-pagination-grid { display:grid; gap:1rem; grid-template-columns:repeat(3,1fr); align-items:center; }
.history-pagination-grid .page-size-col { justify-self:start; }
.history-pagination-grid .paginator-col { justify-self:center; }
.history-pagination-grid .summary-col { justify-self:end; text-align:right; }
.paginator-wrapper { display:flex; justify-content:center; }
@media (max-width: 640px) {
    .history-pagination-grid { grid-template-columns:1fr; }
    .history-pagination-grid .page-size-col, .history-pagination-grid .paginator-col, .history-pagination-grid .summary-col { justify-self:stretch; text-align:left; }
    .summary-col .history-summary { margin-top:.5rem; }
}

/* Search bar alignment */
.search-bar-wrapper { margin-top:.25rem; }
.search-bar-wrapper .search-input :deep(.p-inputtext) { padding-left:2rem; }
.search-bar-wrapper .search-input { position:relative; }
.search-bar-wrapper .search-input i { position:absolute; left:.65rem; top:50%; transform:translateY(-50%); font-size:.9rem; color:var(--surface-400); }
:root[class*='app-dark'] .search-bar-wrapper .search-input i { color:var(--surface-500); }

/* Status filter tags inside options */
.filter-panel :deep(.status-option-tag) { font-size:.65rem; font-weight:600; }
.filter-panel :deep(.status-chip-tag) { font-size:.65rem; font-weight:600; }
</style>
