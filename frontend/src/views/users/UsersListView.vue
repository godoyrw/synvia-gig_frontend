<script setup lang="ts">
import PageHero from '@/components/PageHero.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { TOAST_DURATION, HISTORY_PAGE_SIZE } from '@/config/constants';
import { useUsersStore } from '@/stores/users';
import type { User } from '@/services/users';
import FloatLabel from 'primevue/floatlabel';

const toast = useToast();
const usersStore = useUsersStore();

// Dialog states
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const editingUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);

// Form data
const formData = ref({
    username: '',
    password: '',
    displayName: '',
    clientId: 1,
    role: 'analyst' as 'admin' | 'analyst' | 'viewer',
    avatar: '',
    permissions: [] as string[]
});

// Role options
const roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Analista', value: 'analyst' },
    { label: 'Visualizador', value: 'viewer' }
];

// Permission options
const permissionOptions = [
    { label: 'Todas as Permissões', value: '*' },
    { label: 'SYNVIA-GIG: Todas', value: 'synvia-gig:*' },
    { label: 'SYNVIA-GIG: Leitura', value: 'synvia-gig:read' },
    { label: 'SYNVIA-GIG: Importações', value: 'synvia-gig:imports' },
    { label: 'Documentação: Leitura', value: 'documentation:read' }
];

// Pagination and filtering
const page = ref(1);
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100].map((v) => ({ label: String(v), value: v }));
const pageSize = ref<number>(Number(localStorage.getItem('usersPageSize')) || HISTORY_PAGE_SIZE);
watch(pageSize, (val) => {
    localStorage.setItem('usersPageSize', String(val));
    page.value = 1;
});
const searchTerm = ref('');

// Sorting
const sortField = ref<string | null>(null);
const sortOrder = ref<1 | -1>(1);

// Load users on mount
onMounted(async () => {
    try {
        await usersStore.loadUsers();
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os usuários.',
            life: TOAST_DURATION.ERROR
        });
    }
});

// Filtered and sorted users
const filteredUsers = computed(() => {
    let result = [...usersStore.users];

    // Apply search filter
    const term = searchTerm.value.trim().toLowerCase();
    if (term) {
        result = result.filter((u) => u.displayName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term));
    }

    // Apply sorting
    if (sortField.value) {
        result.sort((a: any, b: any) => {
            const av = a[sortField.value!];
            const bv = b[sortField.value!];
            if (av == null && bv != null) return -1 * sortOrder.value;
            if (av != null && bv == null) return 1 * sortOrder.value;
            if (av == null && bv == null) return 0;
            const avStr = String(av).toLowerCase();
            const bvStr = String(bv).toLowerCase();
            if (avStr < bvStr) return -1 * sortOrder.value;
            if (avStr > bvStr) return 1 * sortOrder.value;
            return 0;
        });
    }

    return result;
});

// Paginated users
const paginatedUsers = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredUsers.value.slice(start, end);
});

const totalRecords = computed(() => filteredUsers.value.length);

const summaryLabel = computed(() => {
    const total = totalRecords.value;
    if (!total) return 'Nenhum usuário encontrado';
    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, total);
    return `Exibindo ${start} a ${end} de ${total} usuários`;
});

// Sorting
const toggleSort = (field: string) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 1 ? -1 : 1;
    } else {
        sortField.value = field;
        sortOrder.value = 1;
    }
    page.value = 1;
};

const sortIndicatorFor = (field: string) => {
    if (sortField.value !== field) return 'pi pi-sort-alt';
    return sortOrder.value === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
};

// Pagination
const handlePageChange = (event: { first: number; rows: number }) => {
    const newPage = Math.floor(event.first / event.rows) + 1;
    page.value = newPage;
};

// Reset page when search changes
watch(searchTerm, () => {
    page.value = 1;
});

// Dialog handlers
const openCreateDialog = () => {
    editingUser.value = null;
    formData.value = {
        username: '',
        password: '',
        displayName: '',
        clientId: 1,
        role: 'analyst',
        avatar: '',
        permissions: []
    };
    showFormDialog.value = true;
};

const openEditDialog = (user: User) => {
    editingUser.value = user;
    formData.value = {
        username: user.username,
        password: '', // Don't show password
        displayName: user.displayName,
        clientId: user.clientId,
        role: user.role,
        avatar: user.avatar,
        permissions: [...user.permissions]
    };
    showFormDialog.value = true;
};

const openDeleteDialog = (user: User) => {
    userToDelete.value = user;
    showDeleteDialog.value = true;
};

// Save handler
const handleSave = async () => {
    try {
        if (editingUser.value) {
            // Update
            const updateData: any = {
                username: formData.value.username,
                displayName: formData.value.displayName,
                clientId: formData.value.clientId,
                role: formData.value.role,
                avatar: formData.value.avatar,
                permissions: formData.value.permissions
            };
            // Only update password if provided
            if (formData.value.password) {
                updateData.password = formData.value.password;
            }
            await usersStore.editUser(editingUser.value.id, updateData);
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Usuário atualizado com sucesso.',
                life: TOAST_DURATION.SUCCESS
            });
        } else {
            // Create
            if (!formData.value.password) {
                toast.add({
                    severity: 'warn',
                    summary: 'Atenção',
                    detail: 'Senha é obrigatória para novos usuários.',
                    life: TOAST_DURATION.WARNING
                });
                return;
            }
            await usersStore.addUser(formData.value);
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Usuário criado com sucesso.',
                life: TOAST_DURATION.SUCCESS
            });
        }
        showFormDialog.value = false;
    } catch (err: any) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: err.message || 'Erro ao salvar usuário.',
            life: TOAST_DURATION.ERROR
        });
    }
};

// Delete handler
const handleDelete = async () => {
    if (!userToDelete.value) return;

    try {
        await usersStore.removeUser(userToDelete.value.id);
        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Usuário removido com sucesso.',
            life: TOAST_DURATION.SUCCESS
        });
        showDeleteDialog.value = false;
        userToDelete.value = null;
    } catch (err: any) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: err.message || 'Erro ao remover usuário.',
            life: TOAST_DURATION.ERROR
        });
    }
};

// Role display
const getRoleLabel = (role: string) => {
    const option = roleOptions.find((r) => r.value === role);
    return option?.label || role;
};

const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'analyst':
            return 'info';
        default:
            return 'secondary';
    }
};
</script>

<template>
    <div class="p-4 lg:p-6 space-y-6">
        <PageHero title="Gerenciamento de Usuários" subtitle="Visualize, crie, edite e remova usuários do sistema." />

        <Card class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
            <template #title>
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <span>Usuários</span>
                    <Button icon="pi pi-plus" label="Novo Usuário" @click="openCreateDialog" />
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-center justify-end gap-3 search-bar-wrapper">
                        <div class="p-input-icon-left search-input">
                            <i class="pi pi-search"></i>
                            <InputText v-model="searchTerm" size="small" class="w-64" placeholder="Buscar usuários..." />
                        </div>
                    </div>
                </div>

                <div class="users-table mt-4">
                    <DataTable :value="paginatedUsers" size="small" :loading="usersStore.loading" responsiveLayout="scroll">
                        <!-- ID Column -->
                        <Column style="width: 5%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'id' }]" @click="toggleSort('id')" aria-label="Ordenar por ID">
                                    <span class="title">ID</span>
                                    <i :class="['sort-icon', sortIndicatorFor('id')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <span class="font-mono text-sm text-surface-500">{{ data.id }}</span>
                            </template>
                        </Column>

                        <!-- User Column -->
                        <Column style="width: 30%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'displayName' }]" @click="toggleSort('displayName')" aria-label="Ordenar por Nome">
                                    <span class="title">Usuário</span>
                                    <i :class="['sort-icon', sortIndicatorFor('displayName')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <Avatar v-if="data.avatar" :image="data.avatar" size="large" shape="circle" />
                                    <Avatar v-else icon="pi pi-user" size="large" shape="circle" />
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">
                                            {{ data.displayName }}
                                        </span>
                                        <small class="text-surface-500">{{ data.username }}</small>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <!-- Role Column -->
                        <Column style="width: 15%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'role' }]" @click="toggleSort('role')" aria-label="Ordenar por Perfil">
                                    <span class="title">Perfil</span>
                                    <i :class="['sort-icon', sortIndicatorFor('role')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
                            </template>
                        </Column>

                        <!-- Client ID Column -->
                        <Column style="width: 10%">
                            <template #header>
                                <button type="button" :class="['sortable-header', { active: sortField === 'clientId' }]" @click="toggleSort('clientId')" aria-label="Ordenar por Cliente">
                                    <span class="title">Cliente</span>
                                    <i :class="['sort-icon', sortIndicatorFor('clientId')]" />
                                </button>
                            </template>
                            <template #body="{ data }">
                                <span class="text-surface-700 dark:text-surface-300">ID: {{ data.clientId }}</span>
                            </template>
                        </Column>

                        <!-- Permissions Column -->
                        <Column header="Permissões" style="width: 25%">
                            <template #body="{ data }">
                                <div class="flex flex-wrap gap-1">
                                    <Tag v-for="perm in data.permissions.slice(0, 3)" :key="perm" :value="perm" severity="secondary" class="text-xs" />
                                    <Tag v-if="data.permissions.length > 3" :value="`+${data.permissions.length - 3}`" severity="info" class="text-xs" />
                                </div>
                            </template>
                        </Column>

                        <!-- Actions Column -->
                        <Column header="Ações" style="width: 15%; text-align: center">
                            <template #body="{ data }">
                                <div class="flex items-center justify-center gap-2">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" aria-label="Editar" @click="openEditDialog(data)" />
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" aria-label="Excluir" @click="openDeleteDialog(data)" />
                                </div>
                            </template>
                        </Column>

                        <template #empty>
                            <Message severity="info" :closable="false">
                                {{ searchTerm ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.' }}
                            </Message>
                        </template>
                    </DataTable>
                </div>

                <div class="mt-6 pagination-grid">
                    <div class="page-size-col">
                        <FloatLabel class="w-full page-size-float" variant="on">
                            <Dropdown v-model="pageSize" inputId="pageSize" :options="PAGE_SIZE_OPTIONS" optionLabel="label" optionValue="value" class="w-full" />
                            <label for="pageSize">Linhas</label>
                        </FloatLabel>
                    </div>
                    <div class="paginator-col">
                        <div class="paginator-wrapper">
                            <Paginator :rows="pageSize" :totalRecords="totalRecords" :first="(page - 1) * pageSize" @page="handlePageChange" />
                        </div>
                    </div>
                    <div class="summary-col">
                        <div class="summary text-sm text-surface-500">
                            <i class="pi pi-users text-primary-400 mr-2"></i>
                            <span>{{ summaryLabel }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Create/Edit Dialog -->
        <Dialog v-model:visible="showFormDialog" :header="editingUser ? 'Editar Usuário' : 'Novo Usuário'" :modal="true" :closable="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="displayName" class="font-medium">Nome de Exibição</label>
                    <InputText id="displayName" v-model="formData.displayName" placeholder="Nome completo" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="username" class="font-medium">E-mail</label>
                    <InputText id="username" v-model="formData.username" placeholder="usuario@synvia.com.br" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="password" class="font-medium">
                        Senha
                        <span v-if="editingUser" class="text-surface-400 font-normal">(deixe em branco para manter)</span>
                    </label>
                    <Password id="password" v-model="formData.password" :feedback="false" toggleMask placeholder="••••••••" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="role" class="font-medium">Perfil</label>
                    <Dropdown id="role" v-model="formData.role" :options="roleOptions" optionLabel="label" optionValue="value" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="clientId" class="font-medium">ID do Cliente</label>
                    <InputNumber id="clientId" v-model="formData.clientId" :min="1" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="avatar" class="font-medium">URL do Avatar</label>
                    <InputText id="avatar" v-model="formData.avatar" placeholder="https://..." />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="permissions" class="font-medium">Permissões</label>
                    <MultiSelect id="permissions" v-model="formData.permissions" :options="permissionOptions" optionLabel="label" optionValue="value" display="chip" placeholder="Selecione as permissões" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="showFormDialog = false" />
                <Button :label="editingUser ? 'Salvar' : 'Criar'" @click="handleSave" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="showDeleteDialog" header="Confirmar Exclusão" :modal="true" :closable="true" :style="{ width: '400px' }">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                <span>
                    Tem certeza que deseja excluir o usuário
                    <strong>{{ userToDelete?.displayName }}</strong
                    >?
                </span>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="showDeleteDialog = false" />
                <Button label="Excluir" severity="danger" @click="handleDelete" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.users-table :deep(.p-datatable) {
    border-radius: 1rem;
    border: 1px solid var(--surface-200);
    overflow: hidden;
}

.users-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    font-size: 0.875rem;
    color: var(--surface-500);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.users-table :deep(.p-datatable-tbody > tr:nth-child(odd)) {
    background: rgba(0, 0, 0, 0.03);
}

:root[class*='app-dark'] .users-table :deep(.p-datatable-tbody > tr:nth-child(odd)) {
    background: rgba(255, 255, 255, 0.05);
}

.users-table :deep(.p-datatable-tbody > tr:hover) {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent);
}

.summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

/* Sorting */
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
    transition: color 0.15s ease;
}
.sortable-header .title {
    font-weight: 600;
}
.sortable-header .sort-icon {
    font-size: 0.8rem;
    opacity: 0.85;
}
.sortable-header:hover {
    color: var(--surface-800);
}
.dark .sortable-header {
    color: var(--surface-400);
}
.dark .sortable-header:hover {
    color: var(--surface-200);
}
.sortable-header.active .sort-icon {
    opacity: 1;
}

/* Pagination grid */
.pagination-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
}
.pagination-grid .page-size-col {
    justify-self: start;
}
.pagination-grid .paginator-col {
    justify-self: center;
}
.pagination-grid .summary-col {
    justify-self: end;
    text-align: right;
}
.paginator-wrapper {
    display: flex;
    justify-content: center;
}
@media (max-width: 640px) {
    .pagination-grid {
        grid-template-columns: 1fr;
    }
    .pagination-grid .page-size-col,
    .pagination-grid .paginator-col,
    .pagination-grid .summary-col {
        justify-self: stretch;
        text-align: left;
    }
    .summary-col .summary {
        margin-top: 0.5rem;
    }
}

/* FloatLabel page size */
.page-size-float :deep(.p-dropdown) {
    font-size: 0.75rem;
}
.page-size-float :deep(.p-dropdown-label) {
    padding: 0.5rem 0.75rem;
}
.page-size-float :deep(.p-floatlabel) {
    width: 100%;
}
.page-size-float {
    max-width: 14rem;
}

/* Search bar */
.search-bar-wrapper {
    margin-top: 0.25rem;
}
.search-bar-wrapper .search-input :deep(.p-inputtext) {
    padding-left: 2rem;
}
.search-bar-wrapper .search-input {
    position: relative;
}
.search-bar-wrapper .search-input i {
    position: absolute;
    left: 0.65rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9rem;
    color: var(--surface-400);
}
:root[class*='app-dark'] .search-bar-wrapper .search-input i {
    color: var(--surface-500);
}
</style>
