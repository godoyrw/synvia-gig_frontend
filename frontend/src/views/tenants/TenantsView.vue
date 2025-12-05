<script setup>
import PageHero from '@core/components/PageHero.vue';
import { createTenant, deleteTenant, listTenants, toggleTenantStatus, updateTenant } from '@/services/tenantsService';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import FloatLabel from 'primevue/floatlabel';
import Popover from 'primevue/popover';
import Textarea from 'primevue/textarea';

const toast = useToast();
const confirm = useConfirm();

const tenants = ref([]);
const loading = ref(false);
const paginator = reactive({ page: 1, rows: 10, total: 0 });
const pageSize = ref(paginator.rows);
const pageSizeOptions = [10, 25, 50, 100].map((value) => ({ label: String(value), value }));
const searchTerm = ref('');
const planFilterSelected = ref([]);
const modulesFilterSelected = ref([]);
const statusFilterSelected = ref([]);
const sortField = ref('id');
const sortOrder = ref(1);
const logoLoadErrors = reactive(new Set());

const dialogVisible = ref(false);
const dialogMode = ref('create');
const savingTenant = ref(false);
const togglingTenantId = ref(null);
const deletingTenantId = ref(null);

const initialFormState = () => ({
    id: null,
    name: '',
    tradeName: '',
    document: '',
    primaryEmail: '',
    primaryPhone: '',
    plan: 'basic',
    modules: [],
    logoUrl: '',
    notes: '',
    active: true,
    createdAt: new Date().toISOString()
});

const form = reactive(initialFormState());
const formErrors = reactive({});
const formLogoError = ref(false);

const moduleOptions = [
    { label: 'GIG', value: 'gig' },
    { label: 'Documentation', value: 'documentation' }
];

const planOptions = [
    { label: 'Basic', value: 'basic' },
    { label: 'Pro', value: 'pro' },
    { label: 'Enterprise', value: 'enterprise' }
];

const dialogTitle = computed(() => (dialogMode.value === 'edit' ? 'Editar Cliente' : 'Novo Cliente'));

const paginationSummary = computed(() => {
    const total = paginator.total || 0;
    if (!total) {
        return 'Nenhum cliente encontrado';
    }

    const start = (paginator.page - 1) * paginator.rows + 1;
    const end = Math.min(paginator.page * paginator.rows, total);
    return `Exibindo ${start} a ${end} de ${total} registros`;
});

const planFilterPanel = ref();
const modulesFilterPanel = ref();
const statusFilterPanel = ref();

const clearPlanFilter = () => {
    planFilterSelected.value = [];
    planFilterPanel.value?.hide();
};

const clearModulesFilter = () => {
    modulesFilterSelected.value = [];
    modulesFilterPanel.value?.hide();
};

const clearStatusFilter = () => {
    statusFilterSelected.value = [];
    statusFilterPanel.value?.hide();
};

const togglePlanFilterPanel = (event) => planFilterPanel.value?.toggle(event);
const toggleModulesFilterPanel = (event) => modulesFilterPanel.value?.toggle(event);
const toggleStatusFilterPanel = (event) => statusFilterPanel.value?.toggle(event);

const distinctModuleOptions = computed(() => {
    const set = new Set();
    tenants.value.forEach((tenant) => {
        (tenant.modules || []).forEach((module) => set.add(module));
    });
    return Array.from(set.values()).map((module) => ({ label: module, value: module }));
});

const statusOptions = [
    { label: 'Ativo', value: 'active' },
    { label: 'Inativo', value: 'inactive' }
];

const resetForm = () => {
    Object.assign(form, initialFormState());
    Object.keys(formErrors).forEach((key) => delete formErrors[key]);
    formLogoError.value = false;
};

const computeNextTenantId = () => {
    const max = tenants.value.reduce((highest, tenant) => {
        const numeric = Number(tenant.id) || 0;
        return numeric > highest ? numeric : highest;
    }, 0);
    return max + 1;
};

const mapFiltersToParams = () => ({
    search: searchTerm.value,
    plans: planFilterSelected.value,
    modules: modulesFilterSelected.value,
    status: statusFilterSelected.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    page: paginator.page,
    rows: paginator.rows
});

const loadTenants = async () => {
    try {
        loading.value = true;
        const response = await listTenants(mapFiltersToParams());
        tenants.value = response.data || [];
        logoLoadErrors.clear();
        paginator.total = response.total ?? tenants.value.length;
        paginator.page = response.page ?? paginator.page;
        paginator.rows = response.rows ?? paginator.rows;
        pageSize.value = paginator.rows;
    } catch (error) {
        console.error('[Tenants] listTenants failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao carregar clientes', detail: 'Tente novamente em instantes.', life: 4000 });
    } finally {
        loading.value = false;
    }
};

const openCreateDialog = () => {
    dialogMode.value = 'create';
    resetForm();
    form.id = computeNextTenantId();
    dialogVisible.value = true;
};

const openEditDialog = (tenant) => {
    if (!tenant) return;
    dialogMode.value = 'edit';
    resetForm();
    Object.assign(form, {
        ...tenant,
        active: tenant.active !== false,
        createdAt: tenant.createdAt || tenant.created_at || new Date().toISOString(),
        id: tenant.id
    });
    dialogVisible.value = true;
};

const closeDialog = () => {
    dialogVisible.value = false;
};

const validateEmail = (value) => {
    if (!value) return false;
    const emailPattern = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;
    return emailPattern.test(value);
};

const validateForm = () => {
    const errors = {};

    if (!form.name?.trim()) {
        errors.name = 'Informe o nome do cliente.';
    }

    if (!validateEmail(form.primaryEmail)) {
        errors.primaryEmail = 'Informe um e-mail válido.';
    }

    if (!form.logoUrl?.trim()) {
        errors.logoUrl = 'Informe a URL da logo do cliente.';
    }

    if (!form.plan) {
        errors.plan = 'Selecione um plano.';
    }

    Object.assign(formErrors, errors);
    Object.keys(formErrors).forEach((key) => {
        if (!errors[key]) delete formErrors[key];
    });

    if (Object.keys(errors).length) {
        toast.add({ severity: 'warn', summary: 'Preencha os campos obrigatórios', detail: 'Verifique os campos destacados.', life: 4000 });
        return false;
    }

    return true;
};

const buildPayload = () => {
    const payload = {
        name: form.name.trim(),
        tradeName: form.tradeName?.trim() || '',
        document: form.document?.trim() || '',
        primaryEmail: form.primaryEmail.trim(),
        primaryPhone: form.primaryPhone?.trim() || '',
        plan: form.plan,
        logoUrl: form.logoUrl.trim(),
        modules: Array.isArray(form.modules) ? form.modules : [],
        notes: form.notes?.trim() || '',
        active: form.active !== false,
        is_active: form.active !== false,
        createdAt: form.createdAt || new Date().toISOString()
    };

    return payload;
};

const handleSaveTenant = async () => {
    if (!validateForm()) return;

    try {
        savingTenant.value = true;
        const payload = buildPayload();

        if (dialogMode.value === 'edit' && form.id != null) {
            await updateTenant(form.id, payload);
            toast.add({ severity: 'success', summary: 'Cliente atualizado', detail: `${payload.name} atualizado com sucesso.`, life: 3500 });
        } else {
            await createTenant(payload);
            toast.add({ severity: 'success', summary: 'Cliente criado', detail: `${payload.name} adicionado com sucesso.`, life: 3500 });
        }

        closeDialog();
        await loadTenants();
    } catch (error) {
        console.error('[Tenants] save failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao salvar cliente', detail: 'Tente novamente.', life: 4000 });
    } finally {
        savingTenant.value = false;
    }
};

const confirmDeleteTenant = (tenant) => {
    if (!tenant) return;
    confirm.require({
        header: 'Excluir cliente',
        message: `Tem certeza que deseja remover ${tenant.name}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, excluir',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: () => performDeleteTenant(tenant),
        reject: () => {}
    });
};

const performDeleteTenant = async (tenant) => {
    try {
        deletingTenantId.value = tenant.id;
        await deleteTenant(tenant.id);
        toast.add({ severity: 'success', summary: 'Cliente removido', detail: `${tenant.name} foi excluído.`, life: 3500 });
        await loadTenants();
    } catch (error) {
        console.error('[Tenants] delete failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao excluir', detail: 'Não foi possível remover o cliente.', life: 4000 });
    } finally {
        deletingTenantId.value = null;
    }
};

const handleToggleStatus = async (tenant) => {
    try {
        togglingTenantId.value = tenant.id;
        const updated = await toggleTenantStatus(tenant.id);
        const message = updated.active ? 'Cliente ativado.' : 'Cliente desativado.';
        toast.add({ severity: 'info', summary: 'Status atualizado', detail: message, life: 3000 });
        await loadTenants();
    } catch (error) {
        console.error('[Tenants] toggle status failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao alterar status', detail: 'Tente novamente.', life: 4000 });
    } finally {
        togglingTenantId.value = null;
    }
};

const handlePageChange = async (event) => {
    paginator.page = event.page + 1;
    paginator.rows = event.rows;
    pageSize.value = paginator.rows;
    await loadTenants();
};

watch(pageSize, (value, previous) => {
    if (value === previous) {
        return;
    }
    paginator.rows = value;
    paginator.page = 1;
    loadTenants();
});

const reloadTenants = () => {
    paginator.page = 1;
    loadTenants();
};

const logoKeyFor = (tenant) => tenant?.id ?? tenant?.name ?? tenant?.primaryEmail ?? '';

const tenantHasLogo = (tenant) => {
    if (!tenant?.logoUrl) return false;
    const key = logoKeyFor(tenant);
    if (!key) return false;
    return !logoLoadErrors.has(key);
};

const handleLogoError = (tenant) => {
    const key = logoKeyFor(tenant);
    if (!key) return;
    logoLoadErrors.add(key);
};

const sortIndicatorFor = (field) => {
    if (sortField.value !== field) return 'pi pi-sort-alt';
    return sortOrder.value === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
};

const ariaSortFor = (field) => {
    if (sortField.value !== field) return 'none';
    return sortOrder.value === 1 ? 'ascending' : 'descending';
};

const toggleSort = (field) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 1 ? -1 : 1;
    } else {
        sortField.value = field;
        sortOrder.value = 1;
    }
    reloadTenants();
};

const planSeverity = (plan) => {
    switch (plan) {
        case 'enterprise':
            return 'primary';
        case 'pro':
            return 'info';
        default:
            return 'secondary';
    }
};

const hasFormLogo = computed(() => !!form.logoUrl?.trim() && !formLogoError.value);
const handleFormLogoError = () => {
    formLogoError.value = true;
};

watch(
    () => form.logoUrl,
    () => {
        formLogoError.value = false;
    }
);

watch(searchTerm, reloadTenants);
watch(planFilterSelected, reloadTenants, { deep: true });
watch(modulesFilterSelected, reloadTenants, { deep: true });
watch(statusFilterSelected, reloadTenants, { deep: true });

onMounted(() => {
    loadTenants();
});
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero label="SYNVIA APP" title="Gestão de Clientes" subtitle="Gerencie os clientes (tenants) e seus módulos habilitados." logoSrc=""/>

        <ConfirmDialog />

        <Card class="border border-surface-200 dark:border-surface-700">
            <template #title>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <span>Clientes cadastrados</span>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="searchTerm" placeholder="Buscar..." />
                        </span>

                        <Button icon="pi pi-plus" label="Novo cliente" @click="openCreateDialog" />
                    </div>
                </div>
            </template>

            <template #content>
                <DataTable :value="tenants" :loading="loading" responsive-layout="scroll">
                    <template #empty>
                        <div class="py-6 text-center text-sm text-surface-500">Nenhum cliente encontrado.</div>
                    </template>

                    <Column field="id" style="width: 6rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'id' }]" aria-label="Ordenar por ID" :aria-sort="ariaSortFor('id')" @click="toggleSort('id')">
                                    <span class="column-title">ID</span>
                                    <i :class="['sort-icon', sortIndicatorFor('id')]" />
                                </button>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <span class="tenant-id-cell">{{ data.id }}</span>
                        </template>
                    </Column>

                    <Column field="name">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'name' }]" aria-label="Ordenar por cliente" :aria-sort="ariaSortFor('name')" @click="toggleSort('name')">
                                    <span class="column-title">Cliente</span>
                                    <i :class="['sort-icon', sortIndicatorFor('name')]" />
                                </button>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <div class="flex items-center gap-3">
                                <span class="tenant-avatar" :aria-label="`Logo de ${data.name}`">
                                    <img v-if="tenantHasLogo(data)" :src="data.logoUrl" :alt="`Logo de ${data.name}`" class="tenant-avatar-image" @error="handleLogoError(data)" />
                                    <span v-else class="tenant-avatar-fallback">{{ data.name?.[0] ?? '?' }}</span>
                                </span>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ data.name }}</span>
                                    <small class="text-surface-500">{{ data.primaryEmail }}</small>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="document" style="min-width: 12rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'document' }]" aria-label="Ordenar por documento" :aria-sort="ariaSortFor('document')" @click="toggleSort('document')">
                                    <span class="column-title">Documento</span>
                                    <i :class="['sort-icon', sortIndicatorFor('document')]" />
                                </button>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <span class="tenant-document">{{ data.document || '—' }}</span>
                        </template>
                    </Column>

                    <Column field="plan" style="width: 10rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'plan' }]" aria-label="Ordenar por plano" :aria-sort="ariaSortFor('plan')" @click="toggleSort('plan')">
                                    <span class="column-title">Plano</span>
                                    <i :class="['sort-icon', sortIndicatorFor('plan')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: planFilterSelected.length > 0 }]" aria-label="Filtrar por plano" @click="togglePlanFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <Popover ref="planFilterPanel" class="filter-panel" style="min-width: 14rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Plano</span>
                                        <Button label="Limpar" size="small" text @click="clearPlanFilter" />
                                    </div>
                                    <MultiSelect v-model="planFilterSelected" :options="planOptions" option-label="label" option-value="value" display="chip" placeholder="Qualquer" class="w-full" />
                                </Popover>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <Tag :severity="planSeverity(data.plan)" class="text-xs">{{ data.plan }}</Tag>
                        </template>
                    </Column>

                    <Column field="modules">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'modules' }]" aria-label="Ordenar por módulos" :aria-sort="ariaSortFor('modules')" @click="toggleSort('modules')">
                                    <span class="column-title">Módulos</span>
                                    <i :class="['sort-icon', sortIndicatorFor('modules')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: modulesFilterSelected.length > 0 }]" aria-label="Filtrar por módulos" @click="toggleModulesFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <Popover ref="modulesFilterPanel" class="filter-panel" style="min-width: 16rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Módulos</span>
                                        <Button label="Limpar" size="small" text @click="clearModulesFilter" />
                                    </div>
                                    <MultiSelect
                                        v-model="modulesFilterSelected"
                                        :options="distinctModuleOptions.length ? distinctModuleOptions : moduleOptions"
                                        option-label="label"
                                        option-value="value"
                                        display="chip"
                                        placeholder="Qualquer"
                                        class="w-full"
                                    />
                                </Popover>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <div class="flex flex-wrap gap-2">
                                <Tag v-for="module in data.modules" :key="module" severity="success" class="text-xs">
                                    {{ module }}
                                </Tag>
                                <span v-if="!data.modules?.length" class="text-xs text-surface-500">Nenhum módulo associado</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="active" style="width: 9rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'active' }]" aria-label="Ordenar por status" :aria-sort="ariaSortFor('active')" @click="toggleSort('active')">
                                    <span class="column-title">Ativo</span>
                                    <i :class="['sort-icon', sortIndicatorFor('active')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: statusFilterSelected.length > 0 }]" aria-label="Filtrar por status" @click="toggleStatusFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <Popover ref="statusFilterPanel" class="filter-panel" style="min-width: 14rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Status</span>
                                        <Button label="Limpar" size="small" text @click="clearStatusFilter" />
                                    </div>
                                    <MultiSelect v-model="statusFilterSelected" :options="statusOptions" option-label="label" option-value="value" display="chip" placeholder="Qualquer" class="w-full" />
                                </Popover>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <Tag :severity="data.active === false ? 'danger' : 'success'">
                                {{ data.active === false ? 'Inativo' : 'Ativo' }}
                            </Tag>
                        </template>
                    </Column>

                    <Column header="Ações" style="width: 12rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" rounded outlined size="small" @click="openEditDialog(data)" />
                                <Button
                                    :icon="data.active === false ? 'pi pi-check' : 'pi pi-ban'"
                                    rounded
                                    outlined
                                    size="small"
                                    :loading="togglingTenantId === data.id"
                                    :severity="data.active === false ? 'success' : 'warning'"
                                    @click="handleToggleStatus(data)"
                                />
                                <Button icon="pi pi-trash" rounded outlined size="small" severity="danger" :loading="deletingTenantId === data.id" @click="confirmDeleteTenant(data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <div class="tenants-pagination-grid">
                    <div class="page-size-col">
                        <FloatLabel class="w-full page-size-float" variant="on">
                            <Dropdown v-model="pageSize" input-id="tenantsPageSize" :options="pageSizeOptions" option-label="label" option-value="value" class="w-full" />
                            <label for="tenantsPageSize">Linhas</label>
                        </FloatLabel>
                    </div>
                    <div class="paginator-col">
                        <div class="paginator-wrapper">
                            <Paginator :rows="paginator.rows" :total-records="paginator.total" :first="(paginator.page - 1) * paginator.rows" @page="handlePageChange" />
                        </div>
                    </div>
                    <div class="summary-col">
                        <div class="tenants-summary text-sm text-surface-500">
                            <i class="pi pi-database text-primary-400 mr-2"></i>
                            <span>{{ paginationSummary }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <Dialog v-model="dialogVisible" modal :header="dialogTitle" :style="{ width: '520px' }">
            <div class="grid gap-4">
                <div class="grid gap-2">
                    <label for="tenantId" class="font-medium">ID</label>
                    <InputText id="tenantId" v-model="form.id" readonly disabled />
                </div>

                <div class="grid gap-2">
                    <label for="tenantName" class="font-medium">Nome do cliente *</label>
                    <InputText id="tenantName" v-model="form.name" :class="{ 'p-invalid': formErrors.name }" />
                    <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="tenantTradeName" class="font-medium">Nome fantasia</label>
                    <InputText id="tenantTradeName" v-model="form.tradeName" />
                </div>

                <div class="grid gap-2">
                    <label for="tenantDocument" class="font-medium">Documento (CNPJ)</label>
                    <InputText id="tenantDocument" v-model="form.document" placeholder="00.000.000/0000-00" />
                </div>

                <div class="grid gap-2">
                    <label for="tenantEmail" class="font-medium">E-mail principal *</label>
                    <InputText id="tenantEmail" v-model="form.primaryEmail" :class="{ 'p-invalid': formErrors.primaryEmail }" />
                    <small v-if="formErrors.primaryEmail" class="p-error">{{ formErrors.primaryEmail }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="tenantPhone" class="font-medium">Telefone</label>
                    <InputText id="tenantPhone" v-model="form.primaryPhone" placeholder="+55 (11) 99999-0000" />
                </div>

                <div class="grid gap-2">
                    <label for="tenantPlan" class="font-medium">Plano *</label>
                    <Dropdown id="tenantPlan" v-model="form.plan" :options="planOptions" option-label="label" option-value="value" placeholder="Selecione" :class="{ 'p-invalid': formErrors.plan }" />
                    <small v-if="formErrors.plan" class="p-error">{{ formErrors.plan }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="tenantModules" class="font-medium">Módulos</label>
                    <MultiSelect id="tenantModules" v-model="form.modules" :options="moduleOptions" option-label="label" option-value="value" display="chip" />
                </div>

                <div class="grid gap-2">
                    <label for="tenantLogo" class="font-medium">Logo (URL) *</label>
                    <InputText id="tenantLogo" v-model="form.logoUrl" placeholder="https://" :class="{ 'p-invalid': formErrors.logoUrl }" />
                    <small v-if="formErrors.logoUrl" class="p-error">{{ formErrors.logoUrl }}</small>
                    <div v-if="form.logoUrl" class="tenant-logo-preview mt-2">
                        <span class="tenant-avatar" :aria-label="`Pré-visualização da logo de ${form.name || 'novo cliente'}`">
                            <img v-if="hasFormLogo" :src="form.logoUrl" :alt="`Logo de ${form.name || 'novo cliente'}`" class="tenant-avatar-image" @error="handleFormLogoError" />
                            <span v-else class="tenant-avatar-fallback">{{ form.name?.[0] ?? '?' }}</span>
                        </span>
                    </div>
                </div>

                <div class="grid gap-2">
                    <label for="tenantNotes" class="font-medium">Notas</label>
                    <Textarea id="tenantNotes" v-model="form.notes" rows="3" auto-resize />
                </div>

                <div class="flex items-center gap-2">
                    <ToggleSwitch v-model="form.active" />
                    <span>Cliente ativo</span>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" text @click="closeDialog" />
                    <Button label="Salvar" icon="pi pi-save" :loading="savingTenant" @click="handleSaveTenant" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
    white-space: nowrap;
}

:deep(.p-tag) {
    text-transform: none;
}

.filter-trigger {
    background: transparent;
    border: 1px solid var(--surface-300);
    color: var(--surface-600);
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    cursor: pointer;
    transition:
        background 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;
}

.filter-trigger:hover {
    background: var(--surface-200);
    color: var(--surface-800);
}

.filter-trigger.active {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent 88%);
}

:root[class*='app-dark'] .filter-trigger {
    border-color: var(--surface-700);
    color: var(--surface-300);
}

:root[class*='app-dark'] .filter-trigger:hover {
    background: var(--surface-700);
    color: var(--surface-0);
}

:root[class*='app-dark'] .filter-trigger.active {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 20%, transparent 80%);
}

.filter-panel :deep(.p-multiselect),
.filter-panel :deep(.p-dropdown) {
    font-size: 0.85rem;
}

.filter-panel :deep(.p-multiselect-label),
.filter-panel :deep(.p-dropdown-label) {
    padding: 0.5rem 0.75rem;
}

.header-with-filter {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.column-title {
    font-weight: 600;
    color: var(--surface-700);
}

:root[class*='app-dark'] .column-title {
    color: var(--surface-0);
}

.sort-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    padding: 0;
    font-weight: 600;
    color: var(--surface-700);
    cursor: pointer;
    transition: color 0.15s ease;
}

.sort-trigger .sort-icon {
    font-size: 0.85rem;
    color: var(--surface-500);
    transition: color 0.15s ease;
}

.sort-trigger:hover,
.sort-trigger:focus-visible {
    color: var(--primary-color);
}

.sort-trigger:hover .sort-icon,
.sort-trigger:focus-visible .sort-icon {
    color: var(--primary-color);
}

.sort-trigger.active {
    color: var(--primary-color);
}

.sort-trigger.active .sort-icon {
    color: var(--primary-color);
}

:root[class*='app-dark'] .sort-trigger {
    color: var(--surface-0);
}

:root[class*='app-dark'] .sort-trigger .sort-icon {
    color: var(--surface-400);
}

:root[class*='app-dark'] .sort-trigger:hover,
:root[class*='app-dark'] .sort-trigger:focus-visible {
    color: var(--primary-color);
}

:root[class*='app-dark'] .sort-trigger:hover .sort-icon,
:root[class*='app-dark'] .sort-trigger:focus-visible .sort-icon {
    color: var(--primary-color);
}

.tenant-id-cell {
    display: inline-block;
    font-family: var(--font-family-mono, 'JetBrains Mono', monospace);
    font-size: 0.85rem;
    color: var(--surface-600);
}

:root[class*='app-dark'] .tenant-id-cell {
    color: var(--surface-300);
}

.tenant-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: var(--surface-200);
    overflow: hidden;
}

.tenant-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.tenant-avatar-fallback {
    font-weight: 600;
    color: var(--surface-600);
}

:root[class*='app-dark'] .tenant-avatar {
    background: var(--surface-800);
}

:root[class*='app-dark'] .tenant-avatar-fallback {
    color: var(--surface-200);
}

.tenant-document {
    font-family: var(--font-family, inherit);
}

.tenants-pagination-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    margin-top: 1.5rem;
    padding: 1.25rem;
    border: 1px solid var(--surface-200);
    border-radius: 1rem;
    background: var(--surface-0);
}

:root[class*='app-dark'] .tenants-pagination-grid {
    background: var(--surface-900);
    border-color: var(--surface-700);
}

.tenants-pagination-grid .page-size-col {
    justify-self: start;
}

.tenants-pagination-grid .paginator-col {
    justify-self: center;
}

.tenants-pagination-grid .summary-col {
    justify-self: end;
    text-align: right;
}

.paginator-wrapper {
    display: flex;
    justify-content: center;
}

.page-size-float :deep(.p-dropdown-label) {
    padding: 0.5rem 0.75rem;
}

.page-size-float :deep(.p-dropdown) {
    font-size: 0.85rem;
}

.tenants-summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

@media (max-width: 768px) {
    .tenants-pagination-grid {
        grid-template-columns: 1fr;
    }

    .tenants-pagination-grid .page-size-col,
    .tenants-pagination-grid .paginator-col,
    .tenants-pagination-grid .summary-col {
        justify-self: stretch;
        text-align: left;
    }

    .tenants-summary {
        justify-content: flex-start;
    }
}

.tenant-logo-preview {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
