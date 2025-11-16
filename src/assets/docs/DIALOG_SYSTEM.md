# 🗨️ Dialog System Documentation - SYNVIA-GIG

## 📋 Objetivo
Documentar o uso de Dialogs na aplicação SYNVIA-GIG, incluindo padrões, exemplos e boas práticas.

---

## 🎯 Tipos de Dialogs Disponíveis

### 1. **Dialog Padrão** (PrimeVue Dialog)
Para mensagens, confirmações e formulários interativos.

```vue
<Dialog
    v-model:visible="displayBasic"
    header="Título do Dialog"
    :modal="true"
    :style="{ width: '50vw' }"
>
    <p>Conteúdo do dialog aqui</p>
    <template #footer>
        <Button label="Cancelar" @click="displayBasic = false" severity="secondary" />
        <Button label="Confirmar" @click="handleConfirm" />
    </template>
</Dialog>
```

### 2. **Confirmação** (ConfirmDialog)
Para ações que precisam de confirmação.

```vue
<ConfirmDialog></ConfirmDialog>

<script setup>
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

const handleDelete = () => {
    confirm.require({
        message: 'Tem certeza que deseja deletar?',
        header: 'Confirmação',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            // Ação confirmada
        },
        reject: () => {
            // Ação cancelada
        }
    });
};
</script>
```

### 3. **Toast/Notificações** (recomendado - em vez de Dialog)
Para mensagens simples de sucesso, erro, aviso.

```vue
<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const showSuccess = () => {
    toast.add({ 
        severity: 'success', 
        summary: 'Sucesso!', 
        detail: 'Operação realizada com sucesso', 
        life: 3000 
    });
};

const showError = () => {
    toast.add({ 
        severity: 'error', 
        summary: 'Erro!', 
        detail: 'Ocorreu um erro na operação', 
        life: 3000 
    });
};
</script>
```

---

## ⚙️ Componente NotificationCenter (Sistema Atual)

**IMPORTANTE:** O projeto usa um sistema de notificações customizado. Prefira usar:

```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications';

const { success, error, warning, info } = useNotifications();

// Sucesso
success('Titulo', 'Mensagem de sucesso');

// Erro
error('Erro!', 'Algo deu errado');

// Aviso
warning('Cuidado!', 'Tenha cuidado com esta ação');

// Informação
info('Info', 'Informação importante');
</script>
```

**Vantagens:**
- ✅ Auto-dismiss (desaparece automaticamente)
- ✅ Suporte completo a dark mode
- ✅ Ícones customizados
- ✅ Posicionamento fixo (top-right)
- ✅ Animações suaves

---

## 📊 Matriz de Decisão: Qual Dialog Usar?

| Situação | Use | Motivo |
|----------|-----|--------|
| Mensagem simples (sucesso/erro/aviso) | **NotificationCenter** | Mais leve, melhor UX |
| Confirmação de ação | **ConfirmDialog** | Padrão, é esperado |
| Formulário/Input | **Dialog** | Mais espaço, melhor para forms |
| Multiplos passos | **Dialog Modal** | Controle total |
| Notificação que some sozinha | **NotificationCenter** | Auto-dismiss |

---

## 🚫 Quando NÃO Usar Dialog

❌ **Para notificações simples** - Use NotificationCenter  
❌ **Para erros de validação** - Use notificações inline + toast  
❌ **Para confirmações rápidas** - Use ConfirmDialog com toast  
❌ **Multiplos dialogs em cascade** - Dificulta UX  

---

## ✅ Boas Práticas

### 1. **Sempre tenha um footer com ações**
```vue
<template #footer>
    <Button label="Cancelar" @click="closeDialog" severity="secondary" />
    <Button label="Confirmar" @click="handleConfirm" severity="primary" />
</template>
```

### 2. **Use `modal: true` para bloquear background**
```vue
<Dialog v-model:visible="show" :modal="true">
    <!-- Isso bloqueia a página ao fundo -->
</Dialog>
```

### 3. **Responsive width**
```vue
<!-- Mobile: 95vw, Desktop: 50vw -->
<Dialog :style="{ width: window.innerWidth < 768 ? '95vw' : '50vw' }">
```

### 4. **Sempre feche dialogs ao terminar**
```vue
const closeDialog = () => {
    displayDialog.value = false;
    resetForm();
};
```

### 5. **Use header + icon para contexto**
```vue
<Dialog header="Deletar Usuário" :modal="true">
    <!-- Icon no header ajuda -->
</Dialog>
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Confirmação de Delete
```vue
<template>
    <ConfirmDialog></ConfirmDialog>
    <Button label="Deletar" @click="confirmDelete" severity="danger" />
</template>

<script setup>
import { useConfirm } from 'primevue/useconfirm';
import { useNotifications } from '@/composables/useNotifications';

const confirm = useConfirm();
const { success, error } = useNotifications();

const confirmDelete = () => {
    confirm.require({
        message: 'Tem certeza que deseja deletar esta conta? Esta ação é irreversível.',
        header: 'Deletar Conta',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
            label: 'Cancelar',
            severity: 'secondary'
        },
        acceptButtonProps: {
            label: 'Deletar',
            severity: 'danger'
        },
        accept: async () => {
            try {
                await deleteAccount();
                success('Sucesso!', 'Conta deletada');
            } catch (err) {
                error('Erro!', 'Falha ao deletar conta');
            }
        }
    });
};
</script>
```

### Exemplo 2: Formulário em Dialog
```vue
<template>
    <Button label="Editar" @click="showEdit" />
    
    <Dialog 
        v-model:visible="displayEdit" 
        header="Editar Perfil" 
        :modal="true"
        :style="{ width: '50vw' }"
    >
        <div class="flex flex-col gap-4">
            <div>
                <label>Nome</label>
                <InputText v-model="form.name" class="w-full" />
            </div>
            <div>
                <label>Email</label>
                <InputText v-model="form.email" class="w-full" />
            </div>
        </div>
        
        <template #footer>
            <Button label="Cancelar" @click="displayEdit = false" severity="secondary" />
            <Button label="Salvar" @click="handleSave" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useNotifications } from '@/composables/useNotifications';

const displayEdit = ref(false);
const { success, error } = useNotifications();

const form = ref({
    name: '',
    email: ''
});

const showEdit = () => {
    // Carregar dados
    form.value = { /* dados */ };
    displayEdit.value = true;
};

const handleSave = async () => {
    try {
        // Salvar
        success('Perfil atualizado!', '');
        displayEdit.value = false;
    } catch (err) {
        error('Erro ao salvar', err.message);
    }
};
</script>
```

### Exemplo 3: Usar NotificationCenter (recomendado)
```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications';

const { success, error, warning, info, remove, clearAll } = useNotifications();

// Ao invés de:
// confirm.require({ message: 'Sucesso!' });

// Use:
success('Operação concluída!', 'Tudo funcionou perfeitamente');

// Ou apenas título:
success('✅ Sucesso!');

// Ou apenas mensagem:
error('❌ Erro ao processar');
</script>
```

---

## 🎨 Styling

### Dark Mode Support
```vue
<Dialog v-model:visible="show" :modal="true">
    <div class="dark:bg-surface-900 dark:text-surface-0">
        <!-- Conteúdo com dark mode -->
    </div>
</Dialog>
```

### CSS Classes Personalizadas
```scss
// Se precisar customizar
::v-deep(.p-dialog) {
    .p-dialog-header {
        background-color: var(--primary-color);
    }
    
    .p-dialog-content {
        padding: 1.5rem;
    }
}
```

---

## 🔄 Estado dos Dialogs

### Usando Ref
```vue
<script setup>
import { ref } from 'vue';

const displayConfirm = ref(false);
const displayEdit = ref(false);
const displayDelete = ref(false);

// Nunca abra múltiplos ao mesmo tempo
const openDialog = (type) => {
    closeAll();
    if (type === 'confirm') displayConfirm.value = true;
    if (type === 'edit') displayEdit.value = true;
    if (type === 'delete') displayDelete.value = true;
};

const closeAll = () => {
    displayConfirm.value = false;
    displayEdit.value = false;
    displayDelete.value = false;
};
</script>
```

---

## ⚡ Performance

### ❌ Ruim
```vue
<!-- Múltiplos dialogs sempre renderizados -->
<Dialog v-model:visible="d1" v-if="show1">...</Dialog>
<Dialog v-model:visible="d2" v-if="show2">...</Dialog>
<Dialog v-model:visible="d3" v-if="show3">...</Dialog>
```

### ✅ Bom
```vue
<!-- Apenas um dialog renderizado por vez -->
<Dialog v-model:visible="show" :modal="true">
    <!-- Conteúdo dinâmico baseado no tipo -->
</Dialog>
```

---

## 🧪 Testando Dialogs

```javascript
// Cypress test example
cy.get('[data-testid="delete-btn"]').click();
cy.get('.p-confirm-dialog').should('be.visible');
cy.get('.p-confirm-dialog .p-button-danger').click();
cy.get('[data-testid="success-notification"]').should('be.visible');
```

---

## 📚 Referências

- [PrimeVue Dialog Docs](https://primevue.org/dialog/)
- [PrimeVue ConfirmDialog Docs](https://primevue.org/confirmdialog/)
- [PrimeVue Toast Docs](https://primevue.org/toast/)
- `src/composables/useNotifications.js` - Sistema customizado

---

## 🎯 Checklist antes de usar Dialog

- ✅ É realmente necessário um dialog? (ou basta uma notificação?)
- ✅ O dialog tem um header claro?
- ✅ O dialog tem footer com ações?
- ✅ O modal está bloqueando o background? (`:modal="true"`)
- ✅ A width é responsiva?
- ✅ Dark mode está funcionando?
- ✅ O dialog fecha corretamente?
- ✅ Não há multiplos dialogs abertos simultaneamente?

---

## 💡 Dicas

1. **Prefira NotificationCenter para mensagens simples** - Melhor UX
2. **Use ConfirmDialog para deletions** - Padrão esperado
3. **Dialog apenas para formulários** - Mais espaço, melhor input
4. **Nunca sobreponha dialogs** - Confunde o usuário
5. **Feche sempre ao terminar** - Reset estado
6. **Teste em mobile** - 95vw de width

---

**Última atualização:** 15 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Ativo
