<script setup lang="ts">
import PageHero from '@/components/PageHero.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { isAxiosError } from 'axios';
import usersData from '@/mock/data-users.json';
import historyMock from '@/mock/import-history.json';
import { fetchImportHistory, type ImportHistoryItem, type ImportHistoryResponse, uploadCsv, type UploadCsvResponse } from '@/services/import';

const toast = useToast();
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const response = ref<UploadCsvResponse | null>(null);

const HISTORY_PAGE_SIZE = 8;
const history = ref<ImportHistoryResponse | null>(null);
const isHistoryLoading = ref(false);
const historyFilter = ref<'ALL' | 'WARN' | 'ERROR'>('ALL');
const historyPage = ref(1);
const historySearch = ref('');
const shouldUseMockHistory = ref(false);

const REQUIRED_COLUMNS = ['guia', 'item', 'procedimento', 'data', 'valor_glosado'] as const;

const hasResult = computed(() => !!response.value);
const isSuccess = computed(() => response.value?.ok);
const summary = computed(() => response.value?.summary);
const rowErrors = computed(() => response.value?.errors ?? []);
const isHeaderError = computed(() => rowErrors.value.some((error) => /cabeçalho inválido/i.test(error.reason ?? '')));
type UserMetadata = {
    id: number | string;
    displayName: string;
    avatar: string;
};

const userList = ((usersData as { users?: UserMetadata[] })?.users ?? []).map((user) => ({
    ...user,
    id: String(user.id)
}));

const mockHistoryItems = ((historyMock as { items?: ImportHistoryItem[] })?.items ?? []).map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp).toISOString()
}));

const decorateHistoryItems = (items: ImportHistoryItem[]) =>
    items.map((item) => {
        const user = userList.find((u) => u.id === String(item.userId));
        return {
            ...item,
            userName: user?.displayName ?? 'Usuário não identificado',
            userAvatar: user?.avatar ?? '/demo/images/avatar/anonymous.png'
        };
    });

const historyItems = computed(() => decorateHistoryItems(history.value?.items ?? []));
const historySearchTerm = computed(() => historySearch.value.trim().toLowerCase());
const historyItemsFiltered = computed(() => {
    const term = historySearchTerm.value;
    if (!term) return historyItems.value;
    return historyItems.value.filter((item) => {
        const haystack = [item.fileName, item.userName, item.requestId, item.status].join(' ').toLowerCase();
        return haystack.includes(term);
    });
});

const historyTotal = computed(() => history.value?.total ?? 0);
const historyHasItems = computed(() => historyItemsFiltered.value.length > 0);
const historyFilteredCount = computed(() => historyItemsFiltered.value.length);
const isMockHistory = computed(() => shouldUseMockHistory.value);
const historySummaryLabel = computed(() => {
    const suffix = shouldUseMockHistory.value ? 'registros de demonstração' : 'registros';
    return `Exibindo ${historyFilteredCount.value} de ${historyTotal.value} ${suffix}`;
});

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const formatKilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(value));

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    selectedFile.value = file ?? null;
    response.value = null;
};

const resetSelection = () => {
    selectedFile.value = null;
    response.value = null;
    if (fileInputRef.value) {
        fileInputRef.value.value = '';
    }
};

const handleUpload = async () => {
    if (!selectedFile.value) {
        toast.add({ severity: 'warn', summary: 'Arquivo obrigatório', detail: 'Selecione um CSV para continuar.', life: 4000 });
        return;
    }

    try {
        isUploading.value = true;
        toast.add({ severity: 'info', summary: 'Processando', detail: 'Enviando arquivo para importação...', life: 2000 });
        const result = await uploadCsv(selectedFile.value);
        response.value = result;

        if (result.ok) {
            toast.add({ severity: 'success', summary: 'Importação concluída', detail: result.message, life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Importação falhou', detail: result.message, life: 6000 });
        }
    } catch (error) {
        console.error(error);
        if (isAxiosError<UploadCsvResponse>(error)) {
            const serverResponse = error.response?.data;
            response.value = serverResponse ?? null;
            const detail = serverResponse?.message ?? 'Não foi possível enviar o CSV. Tente novamente.';
            toast.add({ severity: 'error', summary: 'Importação falhou', detail, life: 6000 });
        } else {
            response.value = null;
            toast.add({ severity: 'error', summary: 'Erro inesperado', detail: 'Não foi possível enviar o CSV. Tente novamente.', life: 6000 });
        }
    } finally {
        isUploading.value = false;
    }
};

const applyMockHistory = () => {
    const filteredByLevel = mockHistoryItems.filter((item) => (historyFilter.value === 'ALL' ? true : item.level === historyFilter.value));
    const orderedByDate = filteredByLevel.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const start = (historyPage.value - 1) * HISTORY_PAGE_SIZE;
    const items = orderedByDate.slice(start, start + HISTORY_PAGE_SIZE);

    history.value = {
        ok: true,
        page: historyPage.value,
        pageSize: HISTORY_PAGE_SIZE,
        total: orderedByDate.length,
        hasNext: start + HISTORY_PAGE_SIZE < orderedByDate.length,
        items
    };

    shouldUseMockHistory.value = true;
};

const loadHistory = async () => {
    if (shouldUseMockHistory.value) {
        applyMockHistory();
        return;
    }

    try {
        isHistoryLoading.value = true;
        const result = await fetchImportHistory({
            page: historyPage.value,
            pageSize: HISTORY_PAGE_SIZE,
            level: historyFilter.value === 'ALL' ? '' : historyFilter.value
        });

        if ((result.total ?? 0) === 0) {
            toast.add({ severity: 'info', summary: 'Histórico', detail: 'Mostrando registros de exemplo para testar o layout.' });
            applyMockHistory();
            return;
        }

        history.value = result;
        shouldUseMockHistory.value = false;
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'warn', summary: 'Histórico', detail: 'Não foi possível carregar do servidor. Exibindo registros simulados.' });
        applyMockHistory();
    } finally {
        isHistoryLoading.value = false;
    }
};

const forceRemoteHistory = () => {
    shouldUseMockHistory.value = false;
    loadHistory();
};

const setHistoryFilter = (filter: 'ALL' | 'WARN' | 'ERROR') => {
    historyFilter.value = filter;
    historyPage.value = 1;
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
        detail: 'Selecione novamente o CSV original acima para reenviar esta importação.',
        life: 5000
    });
};

const handleDeleteHistory = (item: ImportHistoryItem) => {
    console.log('Solicitar remoção de log', item.requestId);
    toast.add({ severity: 'warn', summary: 'Deletar', detail: 'Fluxo de deleção será implementado em breve.' });
};

onMounted(() => {
    loadHistory();
});

watch([historyFilter, historyPage], () => {
    if (shouldUseMockHistory.value) {
        applyMockHistory();
        return;
    }
    loadHistory();
});
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero title="Importação de Arquivos" subtitle="Atenção as regras de importação na documentção ao lado do importador." />

        <div class="grid gap-6 lg:grid-cols-3">
            <Card class="lg:col-span-2 border border-surface-700 bg-surface-900">
                <template #title>Upload</template>
                <template #content>
                    <div class="space-y-4">
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept=".csv,text/csv"
                            class="file-input block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-400 file:text-surface-900"
                            @change="onFileChange"
                        />
                        <div class="flex flex-wrap items-center gap-3" v-if="selectedFile">
                            <Tag value="Arquivo selecionado" severity="success"></Tag>
                            <span class="text-sm text-surface-300">{{ selectedFile.name }}</span>
                            <span class="text-xs text-surface-500">{{ formatBytes(selectedFile.size) }}</span>
                            <Button text severity="info" label="Trocar" size="small" @click="resetSelection" />
                        </div>
                        <div v-else class="text-sm text-surface-500">Nenhum arquivo selecionado.</div>
                        <div class="flex gap-3">
                            <Button icon="pi pi-cloud-upload" label="Enviar" class="flex-1" :disabled="!selectedFile || isUploading" @click="handleUpload" />
                            <Button icon="pi pi-times" label="Limpar" outlined severity="secondary" :disabled="!selectedFile || isUploading" @click="resetSelection" />
                        </div>
                        <p class="text-sm text-surface-400">Envie arquivos até 30MB. Apenas arquivos com extensão .csv são aceitos.</p>
                        <div v-if="isUploading" class="flex items-center gap-2 text-sm text-surface-300">
                            <ProgressSpinner strokeWidth="4" style="width: 30px; height: 30px" />
                            <span>Enviando e validando arquivo...</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="border border-surface-700 bg-surface-900">
                <template #title>Regras rápidas</template>
                <template #content>
                    <ul class="list-disc pl-5 text-sm space-y-2 text-surface-300">
                        <li>Máx. 30MB</li>
                        <li>Extensão .csv e MIME text/csv</li>
                        <li>Primeira linha deve ser o cabeçalho</li>
                        <li>Colunas 1 e 2 são obrigatórias em cada linha</li>
                        <li>O arquivo é enviado com segurança ao S3</li>
                    </ul>
                    <div v-if="isHeaderError" class="mt-4 space-y-2 rounded-lg border border-orange-400/40 bg-orange-400/10 p-3">
                        <p class="text-xs font-semibold uppercase tracking-wide text-orange-200">Colunas obrigatórias</p>
                        <div class="flex flex-wrap gap-2">
                            <Tag v-for="column in REQUIRED_COLUMNS" :key="column" :value="column" severity="warning" rounded></Tag>
                        </div>
                        <p class="text-xs text-surface-200">Garanta que essas colunas estejam exatamente na primeira linha do CSV para liberar o upload.</p>
                    </div>
                </template>
            </Card>
        </div>

        <div v-if="hasResult" class="grid gap-6 lg:grid-cols-2">
            <Card class="border border-surface-700 bg-surface-900">
                <template #title>Resumo da importação</template>
                <template #content>
                    <div v-if="summary" class="grid grid-cols-3 gap-4 text-center">
                        <div class="rounded-lg bg-surface-800 p-4">
                            <p class="text-xs text-surface-400 uppercase mb-1">Total</p>
                            <p class="text-2xl font-bold">{{ summary.totalRows }}</p>
                        </div>
                        <div class="rounded-lg bg-surface-800 p-4">
                            <p class="text-xs text-surface-400 uppercase mb-1">Importados</p>
                            <p class="text-2xl text-green-400 font-bold">{{ summary.importedRows }}</p>
                        </div>
                        <div class="rounded-lg bg-surface-800 p-4">
                            <p class="text-xs text-surface-400 uppercase mb-1">Com erro</p>
                            <p class="text-2xl text-orange-400 font-bold">{{ summary.errorRows }}</p>
                        </div>
                    </div>
                    <Message v-if="isSuccess" severity="success" class="mt-4" :closable="false">
                        {{ response?.message }}
                    </Message>
                    <Message v-else severity="error" class="mt-4" :closable="false">
                        {{ response?.message }}
                    </Message>
                </template>
            </Card>

            <Card v-if="rowErrors.length" class="border border-surface-700 bg-surface-900">
                <template #title>Linhas com erro ({{ rowErrors.length }})</template>
                <template #content>
                    <DataTable :value="rowErrors" size="small" scrollable scrollHeight="250px">
                        <Column field="line" header="Linha" style="width: 30%"></Column>
                        <Column field="reason" header="Motivo"></Column>
                    </DataTable>
                </template>
            </Card>

            <Card v-else class="border border-surface-700 bg-surface-900">
                <template #title>Conferência</template>
                <template #content>
                    <Message severity="info" :closable="false">Nenhuma linha com erro retornada para este arquivo.</Message>
                </template>
            </Card>
        </div>

        <Card class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
            <template #title>Histórico de importações</template>
            <template #content>
                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs uppercase tracking-wide text-surface-500">Status</span>
                        <div class="flex flex-wrap gap-2">
                            <Button label="Todos" size="small" :outlined="historyFilter !== 'ALL'" severity="secondary" @click="setHistoryFilter('ALL')" />
                            <Button label="Avisos" size="small" icon="pi pi-exclamation-triangle" :outlined="historyFilter !== 'WARN'" severity="warning" @click="setHistoryFilter('WARN')" />
                            <Button label="Erros" size="small" icon="pi pi-times-circle" :outlined="historyFilter !== 'ERROR'" severity="danger" @click="setHistoryFilter('ERROR')" />
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2 text-sm text-surface-500">
                            <i class="pi pi-database text-primary-400"></i>
                            <span>{{ historySummaryLabel }}</span>
                            <Tag v-if="isMockHistory" value="dados de exemplo" severity="info" rounded></Tag>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="pi pi-search text-surface-400"></span>
                            <InputText v-model="historySearch" size="small" class="w-full sm:w-72" placeholder="Buscar por arquivo, usuário ou status" />
                            <Button v-if="isMockHistory" label="Tentar novamente" icon="pi pi-refresh" size="small" text @click="forceRemoteHistory" />
                        </div>
                    </div>
                </div>

                <div class="history-table mt-4">
                    <DataTable v-if="historyHasItems" :value="historyItemsFiltered" size="small" :loading="isHistoryLoading" responsiveLayout="scroll">
                        <Column header="Usuário" style="width: 22%">
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <Avatar :image="data.userAvatar" size="large" shape="circle" />
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ data.userName }}</span>
                                        <small class="text-surface-500">ID: {{ data.userId ?? '—' }}</small>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column header="Arquivo" style="width: 28%">
                            <template #body="{ data }">
                                <div>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">{{ data.fileName }}</p>
                                    <small class="text-surface-500">{{ formatKilobytes(data.fileSizeBytes) }} · hash {{ data.fileHash ?? '—' }}</small>
                                </div>
                            </template>
                        </Column>
                        <Column header="Linhas" style="width: 16%">
                            <template #body="{ data }">
                                <div class="flex flex-col text-sm">
                                    <span class="text-surface-600 dark:text-surface-200">Total: {{ data.totalRows }}</span>
                                    <span class="text-orange-400">Erros: {{ data.errorRows }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column header="Status" style="width: 16%">
                            <template #body="{ data }">
                                <Tag class="w-full justify-center" :value="data.level === 'ERROR' ? 'Erro' : data.level === 'WARN' ? 'Aviso' : 'OK'" :severity="data.level === 'ERROR' ? 'danger' : data.level === 'WARN' ? 'warning' : 'success'" />
                                <small class="block text-surface-500 mt-1">{{ formatDateTime(data.timestamp) }}</small>
                            </template>
                        </Column>
                        <Column header="Ações" style="width: 18%">
                            <template #body="{ data }">
                                <div class="flex flex-wrap gap-2">
                                    <Button label="Reenviar" size="small" icon="pi pi-refresh" :disabled="data.errorRows === 0" @click="handleRetryHistory(data)" />
                                    <Button label="Deletar" size="small" icon="pi pi-trash" severity="danger" outlined @click="handleDeleteHistory(data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <Message v-else severity="info" :closable="false">
                        {{ historySearchTerm ? 'Nenhum registro encontrado para esta busca.' : 'Nenhuma importação registrada para os filtros atuais.' }}
                    </Message>
                </div>

                <Paginator class="mt-6 justify-center" :rows="HISTORY_PAGE_SIZE" :totalRecords="historyTotal" :first="(historyPage - 1) * HISTORY_PAGE_SIZE" @page="handleHistoryPageChange" />
            </template>
        </Card>
    </div>
</template>

<style scoped>
.file-input::-webkit-file-upload-button {
    cursor: pointer;
}
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

.history-table :deep(.p-tag) {
    font-weight: 600;
}
</style>
