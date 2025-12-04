<script setup>
import PageHero from '@core/components/PageHero.vue';
import { createUser, deleteUser, listUsers, toggleUserStatus, updateUser } from '@/services/usersService';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import FloatLabel from 'primevue/floatlabel';
import OverlayPanel from 'primevue/overlaypanel';

const toast = useToast();
const confirm = useConfirm();

const users = ref([]);
const loading = ref(false);
const paginator = reactive({ page: 1, rows: 10, total: 0 });
const pageSize = ref(paginator.rows);
const pageSizeOptions = [10, 25, 50, 100].map((value) => ({ label: String(value), value }));
const searchTerm = ref('');
const roleFilterSelected = ref([]);
const nameFilterSelected = ref([]);
const modulesFilterSelected = ref([]);
const statusFilterSelected = ref([]);
const sortField = ref('clientId');
const sortOrder = ref(-1);
const avatarLoadErrors = reactive(new Set());

const dialogVisible = ref(false);
const dialogMode = ref('create');
const savingUser = ref(false);
const togglingUserId = ref(null);
const deletingUserId = ref(null);

const initialFormState = () => ({
    id: null,
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
    clientId: null,
    role: 'viewer',
    avatar: '',
    modules: [],
    permissions: [],
    active: true
});

const form = reactive(initialFormState());
const formErrors = reactive({});

const moduleOptions = [
    { label: 'GIG', value: 'gig' },
    { label: 'Documentation', value: 'documentation' }
];

const permissionOptions = [
    { label: 'Todos (*)', value: '*' },
    { label: 'GIG - completo', value: 'gig:*' },
    { label: 'Documentação (leitura)', value: 'documentation:read' },
    { label: 'GIG - leitura', value: 'synvia-gig:read' },
    { label: 'GIG - importações', value: 'synvia-gig:imports' }
];

const roleOptions = computed(() => {
    const base = new Set(['admin', 'analyst', 'viewer']);
    users.value.forEach((user) => {
        if (user.role) base.add(user.role);
    });

    return Array.from(base).map((role) => ({
        label: role.charAt(0).toUpperCase() + role.slice(1),
        value: role
    }));
});

const dialogTitle = computed(() => (dialogMode.value === 'edit' ? 'Editar Usuário' : 'Novo Usuário'));

const paginationSummary = computed(() => {
    const total = paginator.total || 0;
    if (!total) {
        return 'Nenhum registro encontrado';
    }

    const start = (paginator.page - 1) * paginator.rows + 1;
    const end = Math.min(paginator.page * paginator.rows, total);
    return `Exibindo ${start} a ${end} de ${total} registros`;
});

const nameFilterPanel = ref();
const modulesFilterPanel = ref();
const statusFilterPanel = ref();
const roleFilterPanel = ref();

const clearNameFilter = () => {
    nameFilterSelected.value = [];
    nameFilterPanel.value?.hide();
};

const clearModulesFilter = () => {
    modulesFilterSelected.value = [];
    modulesFilterPanel.value?.hide();
};

const clearStatusFilter = () => {
    statusFilterSelected.value = [];
    statusFilterPanel.value?.hide();
};

const clearRoleFilter = () => {
    roleFilterSelected.value = [];
    roleFilterPanel.value?.hide();
};

const toggleNameFilterPanel = (event) => nameFilterPanel.value?.toggle(event);
const toggleModulesFilterPanel = (event) => modulesFilterPanel.value?.toggle(event);
const toggleStatusFilterPanel = (event) => statusFilterPanel.value?.toggle(event);
const toggleRoleFilterPanel = (event) => roleFilterPanel.value?.toggle(event);

const distinctNameOptions = computed(() => {
    const map = new Map();
    users.value.forEach((user) => {
        if (!user?.displayName) return;
        const key = user.displayName.trim();
        if (!map.has(key)) {
            map.set(key, {
                label: key,
                value: key,
                avatar: user.avatar
            });
        }
    });
    return Array.from(map.values());
});

const distinctModuleOptions = computed(() => {
    const set = new Set();
    users.value.forEach((user) => {
        (user.modules || []).forEach((module) => set.add(module));
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
};

const computeNextClientId = () => {
    const max = users.value.reduce((highest, user) => {
        const numeric = Number(user.clientId) || 0;
        return numeric > highest ? numeric : highest;
    }, 0);
    return max + 1;
};

const mapFiltersToParams = () => ({
    search: searchTerm.value,
    roles: roleFilterSelected.value,
    names: nameFilterSelected.value,
    modules: modulesFilterSelected.value,
    status: statusFilterSelected.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    page: paginator.page,
    rows: paginator.rows
});

const loadUsers = async () => {
    try {
        loading.value = true;
        const response = await listUsers(mapFiltersToParams());
        users.value = response.data || [];
        avatarLoadErrors.clear();
        paginator.total = response.total ?? users.value.length;
        paginator.page = response.page ?? paginator.page;
        paginator.rows = response.rows ?? paginator.rows;
        pageSize.value = paginator.rows;
    } catch (error) {
        console.error('[Users] listUsers failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao carregar usuários', detail: 'Tente novamente em instantes.', life: 4000 });
    } finally {
        loading.value = false;
    }
};

const openCreateDialog = () => {
    dialogMode.value = 'create';
    resetForm();
    form.clientId = computeNextClientId();
    dialogVisible.value = true;
};

const openEditDialog = (user) => {
    if (!user) return;
    dialogMode.value = 'edit';
    resetForm();
    Object.assign(form, {
        ...user,
        active: user.active !== false,
        clientId: user.clientId ?? computeNextClientId(),
        password: '',
        confirmPassword: ''
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

    if (!form.displayName?.trim()) {
        errors.displayName = 'Informe o nome do usuário.';
    }

    if (!validateEmail(form.username)) {
        errors.username = 'Informe um e-mail válido.';
    }

    if (dialogMode.value === 'create') {
        if (!form.password || form.password.length < 8) {
            errors.password = 'Senha obrigatória (mínimo 8 caracteres).';
        }
        if (!form.confirmPassword?.trim()) {
            errors.confirmPassword = 'Repita a senha para confirmar.';
        } else if (form.password !== form.confirmPassword) {
            errors.confirmPassword = 'As senhas devem ser iguais.';
        }
    } else if (form.password && form.password.length < 8) {
        errors.password = 'Senha deve ter pelo menos 8 caracteres.';
    }

    if (dialogMode.value === 'edit' && form.password) {
        if (!form.confirmPassword?.trim()) {
            errors.confirmPassword = 'Repita a nova senha para confirmar.';
        } else if (form.password !== form.confirmPassword) {
            errors.confirmPassword = 'As senhas devem ser iguais.';
        }
    }

    if (!form.role) {
        errors.role = 'Selecione uma função (role).';
    }

    Object.assign(formErrors, errors);
    Object.keys(formErrors).forEach((key) => {
        if (!errors[key]) delete formErrors[key];
    });

    if (Object.keys(errors).length) {
        toast.add({ severity: 'warn', summary: 'Preencha os campos obrigatórios', detail: 'Verifique os campos marcados no formulário.', life: 4000 });
        return false;
    }

    return true;
};

const buildPayload = () => {
    const payload = {
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        clientId: Number(form.clientId) || computeNextClientId(),
        role: form.role,
        avatar: form.avatar?.trim() || '',
        modules: Array.isArray(form.modules) ? form.modules : [],
        permissions: Array.isArray(form.permissions) ? form.permissions : [],
        active: form.active
    };

    if (form.password) {
        payload.password = form.password;
    }

    return payload;
};

const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
        savingUser.value = true;
        const payload = buildPayload();

        if (dialogMode.value === 'edit' && form.id != null) {
            await updateUser(form.id, payload);
            toast.add({ severity: 'success', summary: 'Usuário atualizado', detail: `${form.displayName} atualizado com sucesso.`, life: 3500 });
        } else {
            await createUser({ ...payload, password: payload.password || form.password });
            toast.add({ severity: 'success', summary: 'Usuário criado', detail: `${payload.displayName} adicionado com sucesso.`, life: 3500 });
        }

        closeDialog();
        await loadUsers();
    } catch (error) {
        console.error('[Users] save failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao salvar usuário', detail: 'Tente novamente.', life: 4000 });
    } finally {
        savingUser.value = false;
    }
};

const confirmDeleteUser = (user) => {
    if (!user) return;
    confirm.require({
        header: 'Excluir usuário',
        message: `Tem certeza que deseja remover ${user.displayName}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, excluir',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: () => performDeleteUser(user),
        reject: () => {}
    });
};

const performDeleteUser = async (user) => {
    try {
        deletingUserId.value = user.id;
        await deleteUser(user.id);
        toast.add({ severity: 'success', summary: 'Usuário removido', detail: `${user.displayName} foi excluído.`, life: 3500 });
        await loadUsers();
    } catch (error) {
        console.error('[Users] delete failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao excluir', detail: 'Não foi possível remover o usuário.', life: 4000 });
    } finally {
        deletingUserId.value = null;
    }
};

const handleToggleStatus = async (user) => {
    try {
        togglingUserId.value = user.id;
        const updated = await toggleUserStatus(user.id);
        const message = updated.active ? 'Usuário ativado.' : 'Usuário desativado.';
        toast.add({ severity: 'info', summary: 'Status atualizado', detail: message, life: 3000 });
        await loadUsers();
    } catch (error) {
        console.error('[Users] toggle status failed', error);
        toast.add({ severity: 'error', summary: 'Erro ao alterar status', detail: 'Tente novamente.', life: 4000 });
    } finally {
        togglingUserId.value = null;
    }
};

const handlePageChange = async (event) => {
    paginator.page = event.page + 1;
    paginator.rows = event.rows;
    pageSize.value = paginator.rows;
    await loadUsers();
};

watch(pageSize, (value, previous) => {
    if (value === previous) {
        return;
    }
    paginator.rows = value;
    paginator.page = 1;
    loadUsers();
});

const reloadUsers = () => {
    paginator.page = 1;
    loadUsers();
};

const avatarKeyFor = (user) => user?.id ?? user?.clientId ?? user?.username ?? user?.displayName ?? '';

const userHasAvatar = (user) => {
    if (!user?.avatar) return false;
    const key = avatarKeyFor(user);
    if (!key) return false;
    return !avatarLoadErrors.has(key);
};

const handleAvatarError = (user) => {
    const key = avatarKeyFor(user);
    if (!key) return;
    avatarLoadErrors.add(key);
};

const toggleSort = (field) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 1 ? -1 : 1;
    } else {
        sortField.value = field;
        sortOrder.value = 1;
    }
    reloadUsers();
};

const sortIndicatorFor = (field) => {
    if (sortField.value !== field) return 'pi pi-sort-alt';
    return sortOrder.value === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
};

const ariaSortFor = (field) => {
    if (sortField.value !== field) return 'none';
    return sortOrder.value === 1 ? 'ascending' : 'descending';
};

watch(searchTerm, reloadUsers);
watch(roleFilterSelected, reloadUsers, { deep: true });
watch(nameFilterSelected, reloadUsers, { deep: true });
watch(modulesFilterSelected, reloadUsers, { deep: true });
watch(statusFilterSelected, reloadUsers, { deep: true });

onMounted(() => {
    loadUsers();
});
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero label="SYNVIA APP" title="Gestão de Usuários" subtitle="Gerencie perfis, permissões e acesso aos módulos do SYNVIA-APP." />

        <ConfirmDialog />

        <Card class="border border-surface-200 dark:border-surface-700">
            <template #title>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <span>Usuários cadastrados</span>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="searchTerm" placeholder="Buscar..." />
                        </span>

                        <Button icon="pi pi-plus" label="Novo usuário" @click="openCreateDialog" />
                    </div>
                </div>
            </template>

            <template #content>
                <DataTable :value="users" :loading="loading" responsive-layout="scroll">
                    <template #empty>
                        <div class="py-6 text-center text-sm text-surface-500">Nenhum usuário encontrado.</div>
                    </template>

                    <Column field="clientId" style="width: 6rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'clientId' }]" aria-label="Ordenar por ID" :aria-sort="ariaSortFor('clientId')" @click="toggleSort('clientId')">
                                    <span class="column-title">ID</span>
                                    <i :class="['sort-icon', sortIndicatorFor('clientId')]" />
                                </button>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <span class="id-cell">{{ data.clientId }}</span>
                        </template>
                    </Column>

                    <Column field="displayName">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'displayName' }]" aria-label="Ordenar por usuário" :aria-sort="ariaSortFor('displayName')" @click="toggleSort('displayName')">
                                    <span class="column-title">Usuário</span>
                                    <i :class="['sort-icon', sortIndicatorFor('displayName')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: nameFilterSelected.length > 0 }]" aria-label="Filtrar por nome" @click="toggleNameFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <OverlayPanel ref="nameFilterPanel" class="filter-panel" style="min-width: 16rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Nome</span>
                                        <Button label="Limpar" size="small" text @click="clearNameFilter" />
                                    </div>
                                    <MultiSelect v-model="nameFilterSelected" :options="distinctNameOptions" option-label="label" option-value="value" display="chip" class="w-full" placeholder="Qualquer">
                                        <template #option="{ option }">
                                            <div class="flex items-center gap-2">
                                                <Avatar v-if="option.avatar" :image="option.avatar" shape="circle" size="small" />
                                                <Avatar v-else icon="pi pi-user" shape="circle" size="small" />
                                                <span>{{ option.label }}</span>
                                            </div>
                                        </template>
                                    </MultiSelect>
                                </OverlayPanel>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <div class="flex items-center gap-3">
                                <span class="user-avatar" :aria-label="`Avatar de ${data.displayName}`">
                                    <img v-if="userHasAvatar(data)" :src="data.avatar" :alt="`Avatar de ${data.displayName}`" class="user-avatar-image" @error="handleAvatarError(data)" />
                                    <span v-else class="user-avatar-fallback">{{ data.displayName?.[0] ?? '?' }}</span>
                                </span>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ data.displayName }}</span>
                                    <small class="text-surface-500">{{ data.username }}</small>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="role" style="width: 9rem">
                        <template #header>
                            <div class="header-with-filter">
                                <button type="button" :class="['sort-trigger', { active: sortField === 'role' }]" aria-label="Ordenar por função" :aria-sort="ariaSortFor('role')" @click="toggleSort('role')">
                                    <span class="column-title">Função</span>
                                    <i :class="['sort-icon', sortIndicatorFor('role')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: roleFilterSelected.length > 0 }]" aria-label="Filtrar por função" @click="toggleRoleFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <OverlayPanel ref="roleFilterPanel" class="filter-panel" style="min-width: 14rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Função</span>
                                        <Button label="Limpar" size="small" text @click="clearRoleFilter" />
                                    </div>
                                    <MultiSelect v-model="roleFilterSelected" :options="roleOptions" option-label="label" option-value="value" display="chip" placeholder="Qualquer" class="w-full" />
                                </OverlayPanel>
                            </div>
                        </template>
                        <template #body="{ data }">
                            <Tag :severity="data.role === 'admin' ? 'primary' : 'info'">{{ data.role }}</Tag>
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
                                <OverlayPanel ref="modulesFilterPanel" class="filter-panel" style="min-width: 16rem">
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
                                </OverlayPanel>
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
                                    <span class="column-title">Status</span>
                                    <i :class="['sort-icon', sortIndicatorFor('active')]" />
                                </button>
                                <button type="button" :class="['filter-trigger', { active: statusFilterSelected.length > 0 }]" aria-label="Filtrar por status" @click="toggleStatusFilterPanel($event)">
                                    <i class="pi pi-filter" />
                                </button>
                                <OverlayPanel ref="statusFilterPanel" class="filter-panel" style="min-width: 14rem">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold">Filtrar Status</span>
                                        <Button label="Limpar" size="small" text @click="clearStatusFilter" />
                                    </div>
                                    <MultiSelect v-model="statusFilterSelected" :options="statusOptions" option-label="label" option-value="value" display="chip" placeholder="Qualquer" class="w-full" />
                                </OverlayPanel>
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
                                    :loading="togglingUserId === data.id"
                                    :severity="data.active === false ? 'success' : 'warning'"
                                    @click="handleToggleStatus(data)"
                                />
                                <Button icon="pi pi-trash" rounded outlined size="small" severity="danger" :loading="deletingUserId === data.id" @click="confirmDeleteUser(data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <div class="users-pagination-grid">
                    <div class="page-size-col">
                        <FloatLabel class="w-full page-size-float" variant="on">
                            <Dropdown v-model="pageSize" input-id="usersPageSize" :options="pageSizeOptions" option-label="label" option-value="value" class="w-full" />
                            <label for="usersPageSize">Linhas</label>
                        </FloatLabel>
                    </div>
                    <div class="paginator-col">
                        <div class="paginator-wrapper">
                            <Paginator :rows="paginator.rows" :total-records="paginator.total" :first="(paginator.page - 1) * paginator.rows" @page="handlePageChange" />
                        </div>
                    </div>
                    <div class="summary-col">
                        <div class="users-summary text-sm text-surface-500">
                            <i class="pi pi-database text-primary-400 mr-2"></i>
                            <span>{{ paginationSummary }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <Dialog v-model:visible="dialogVisible" modal :header="dialogTitle" :style="{ width: '500px' }">
            <div class="grid gap-4">
                <div class="grid gap-2">
                    <label for="clientId" class="font-medium">ID</label>
                    <InputText id="clientId" v-model="form.clientId" readonly disabled />
                </div>

                <div class="grid gap-2">
                    <label for="displayName" class="font-medium">Nome completo *</label>
                    <InputText id="displayName" v-model="form.displayName" :class="{ 'p-invalid': formErrors.displayName }" />
                    <small v-if="formErrors.displayName" class="p-error">{{ formErrors.displayName }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="username" class="font-medium">E-mail *</label>
                    <InputText id="username" v-model="form.username" :class="{ 'p-invalid': formErrors.username }" />
                    <small v-if="formErrors.username" class="p-error">{{ formErrors.username }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="password" class="font-medium">Senha {{ dialogMode === 'edit' ? '(opcional)' : '*' }}</label>
                    <Password
                        id="password"
                        v-model="form.password"
                        :toggle-mask="true"
                        input-class="w-full"
                        :feedback="dialogMode === 'create'"
                        prompt-label="Digite uma senha"
                        weak-label="Fraca"
                        medium-label="Média"
                        strong-label="Forte"
                        :class="{ 'p-invalid': formErrors.password }"
                    />
                    <small v-if="formErrors.password" class="p-error">{{ formErrors.password }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="confirmPassword" class="font-medium">Repita a senha {{ dialogMode === 'edit' ? '(obrigatório ao alterar)' : '*' }}</label>
                    <Password
                        id="confirmPassword"
                        v-model="form.confirmPassword"
                        :toggle-mask="true"
                        input-class="w-full"
                        :feedback="false"
                        prompt-label="Repita a senha"
                        weak-label="Fraca"
                        medium-label="Média"
                        strong-label="Forte"
                        :class="{ 'p-invalid': formErrors.confirmPassword }"
                    />
                    <small v-if="formErrors.confirmPassword" class="p-error">{{ formErrors.confirmPassword }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="role" class="font-medium">Função *</label>
                    <Dropdown id="role" v-model="form.role" :options="roleOptions" option-label="label" option-value="value" placeholder="Selecione" :class="{ 'p-invalid': formErrors.role }" />
                    <small v-if="formErrors.role" class="p-error">{{ formErrors.role }}</small>
                </div>

                <div class="grid gap-2">
                    <label for="avatar" class="font-medium">Avatar (URL)</label>
                    <InputText id="avatar" v-model="form.avatar" placeholder="https://" />
                </div>

                <div class="grid gap-2">
                    <label for="modules" class="font-medium">Módulos</label>
                    <MultiSelect id="modules" v-model="form.modules" :options="moduleOptions" option-label="label" option-value="value" display="chip" />
                </div>

                <div class="grid gap-2">
                    <label for="permissions" class="font-medium">Permissões</label>
                    <MultiSelect id="permissions" v-model="form.permissions" :options="permissionOptions" option-label="label" option-value="value" display="chip" filter />
                </div>

                <div class="flex items-center gap-2">
                    <ToggleSwitch v-model="form.active" />
                    <span>Status ativo</span>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" text @click="closeDialog" />
                    <Button label="Salvar" icon="pi pi-save" :loading="savingUser" @click="handleSaveUser" />
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
    background: rgba(59, 130, 246, 0.12);
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
    background: rgba(59, 130, 246, 0.18);
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

.id-cell {
    display: inline-block;
    font-family: var(--font-family-mono, 'JetBrains Mono', monospace);
    font-size: 0.85rem;
    color: var(--surface-600);
}

:root[class*='app-dark'] .id-cell {
    color: var(--surface-300);
}

.user-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: var(--surface-200);
    overflow: hidden;
}

.user-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.user-avatar-fallback {
    font-weight: 600;
    color: var(--surface-600);
}

:root[class*='app-dark'] .user-avatar {
    background: var(--surface-800);
}

:root[class*='app-dark'] .user-avatar-fallback {
    color: var(--surface-200);
}

.users-pagination-grid {
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

:root[class*='app-dark'] .users-pagination-grid {
    background: var(--surface-900);
    border-color: var(--surface-700);
}

.users-pagination-grid .page-size-col {
    justify-self: start;
}

.users-pagination-grid .paginator-col {
    justify-self: center;
}

.users-pagination-grid .summary-col {
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

.users-summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

@media (max-width: 768px) {
    .users-pagination-grid {
        grid-template-columns: 1fr;
    }

    .users-pagination-grid .page-size-col,
    .users-pagination-grid .paginator-col,
    .users-pagination-grid .summary-col {
        justify-self: stretch;
        text-align: left;
    }

    .users-summary {
        justify-content: flex-start;
    }
}
</style>
