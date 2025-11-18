<script setup lang="ts">
import PageHero from '@/components/PageHero.vue';
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { uploadCsv, type UploadCsvResponse } from '@/services/import';

const toast = useToast();
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const response = ref<UploadCsvResponse | null>(null);

const hasResult = computed(() => !!response.value);
const isSuccess = computed(() => response.value?.ok);
const summary = computed(() => response.value?.summary);
const rowErrors = computed(() => response.value?.errors ?? []);

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

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
        response.value = null;
        toast.add({ severity: 'error', summary: 'Erro inesperado', detail: 'Não foi possível enviar o CSV. Tente novamente.', life: 6000 });
    } finally {
        isUploading.value = false;
    }
};
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
                    <div class="mt-4 text-sm text-surface-400" v-if="response?.s3">
                        <p class="font-semibold text-surface-200 mb-1">Arquivo no S3</p>
                        <p class="truncate text-xs">{{ response.s3.path }}</p>
                        <a v-if="response.s3.url" :href="response.s3.url" target="_blank" rel="noreferrer" class="text-primary-300 text-xs underline">Abrir na AWS</a>
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
    </div>
</template>

<style scoped>
.file-input::-webkit-file-upload-button {
    cursor: pointer;
}
</style>
