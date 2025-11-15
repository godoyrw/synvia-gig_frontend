# 🔔 Sistema de Notificações Push

Documentação completa do sistema de notificações da aplicação SYNVIA GIG.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Como Usar](#como-usar)
5. [Exemplos](#exemplos)
6. [Customização](#customização)
7. [API Reference](#api-reference)

---

## 🎯 Visão Geral

O sistema de notificações permite exibir mensagens visuais para o usuário de forma não-intrusiva. Suporta:

- ✅ 4 tipos de notificações: `success`, `error`, `warning`, `info`
- ✅ Auto-remover após tempo configurável
- ✅ Animações suaves de entrada e saída
- ✅ Dark mode completo
- ✅ Fila de múltiplas notificações simultâneas
- ✅ Callbacks personalizados ao fechar
- ✅ Ícones PrimeIcons customizáveis

---

## 🏗️ Arquitetura

### Componentes do Sistema

```
┌─────────────────────────────────────┐
│    useNotifications() [Composable]   │  ← Interface do usuário
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  useNotificationStore() [Pinia]     │  ← Gerenciador de estado
│  - add()                            │
│  - remove()                         │
│  - success/error/warning/info()     │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  NotificationCenter.vue [Component] │  ← Renderização visual
└─────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuário chama notify.success()
        ↓
useNotifications() (composable)
        ↓
useNotificationStore.success() (Pinia)
        ↓
Store adiciona notificação à lista
        ↓
NotificationCenter.vue detecta mudança
        ↓
Renderiza notificação com animação
        ↓
Timer dispara após duração
        ↓
Remove notificação com animação de saída
```

---

## 📦 Componentes

### 1. `src/stores/notifications.js` (Pinia Store)

**Responsabilidades:**
- Gerenciar fila de notificações
- Gerar IDs únicos
- Auto-remover após duração
- Executar callbacks

**State:**
```javascript
{
  notifications: [],  // Array de notificações ativas
  nextId: 0          // Contador para IDs únicos
}
```

### 2. `src/components/NotificationCenter.vue`

**Responsabilidades:**
- Renderizar notificações na tela
- Aplicar estilos baseado no tipo
- Animar entrada/saída
- Suportar dark mode

**Props:** Nenhuma (consome do store)

**Emits:** Nenhum (comunica com store)

### 3. `src/composables/useNotifications.js`

**Responsabilidades:**
- Fornecer interface amigável
- Wrapper da store
- Type hints para IDE

**Métodos:**
- `notify(config)` - Notificação customizada
- `success(title, message, options)`
- `error(title, message, options)`
- `warning(title, message, options)`
- `info(title, message, options)`
- `remove(id)` - Remove notificação específica
- `clearAll()` - Remove todas
- `hasNotifications()` - Verifica se há notificações
- `totalNotifications()` - Conta de notificações ativas

---

## 🚀 Como Usar

### Instalação

✅ Já está instalado! Apenas use em qualquer componente.

### Básico

```vue
<script setup>
import { useNotifications } from '@/composables'

const notify = useNotifications()

const handleSubmit = () => {
  notify.success('Salvo!', 'Dados foram salvos com sucesso.')
}
</script>

<template>
  <button @click="handleSubmit">Salvar</button>
</template>
```

### Em Async/Await

```javascript
const handleDelete = async () => {
  try {
    await deleteItem(id)
    notify.success('Deletado', 'Item foi removido com sucesso.')
  } catch (error) {
    notify.error('Erro', error.message)
  }
}
```

### Com Callback

```javascript
notify.success('Sucesso', 'Redirecionando...', {
  onClose: () => {
    router.push('/home')
  }
})
```

---

## 📝 Exemplos

### 1. Notificação de Sucesso

```javascript
notify.success('Operação concluída!', 'Suas alterações foram salvas.')
```

**Output:** Verde, desaparece em 4s, com ícone de check

### 2. Notificação de Erro

```javascript
notify.error('Erro ao conectar', 'Verifique sua conexão com a internet.')
```

**Output:** Vermelho, desaparece em 6s, com ícone de exclamação

### 3. Notificação de Aviso

```javascript
notify.warning('Atenção!', 'Esta ação não pode ser desfeita.')
```

**Output:** Amarelo, desaparece em 5s, com ícone de triângulo

### 4. Notificação Informativa

```javascript
notify.info('Novidade', 'Uma nova feature foi adicionada.')
```

**Output:** Azul, desaparece em 4s, com ícone de info

### 5. Notificação Customizada

```javascript
notify.notify({
  type: 'warning',
  title: 'Sincronizando...',
  message: 'Não feche a aba',
  duration: 0,  // Permanente
  icon: 'pi-spin pi-spinner'
})
```

### 6. Em um Formulário Completo

```vue
<script setup>
import { useNotifications } from '@/composables'
import { ref } from 'vue'

const notify = useNotifications()
const form = ref({ name: '', email: '' })
const loading = ref(false)

const handleSubmit = async () => {
  if (!form.value.name) {
    notify.warning('Validação', 'Preencha o nome')
    return
  }

  try {
    loading.value = true
    const response = await api.post('/users', form.value)
    
    notify.success(
      'Usuário criado!',
      `Bem-vindo, ${response.data.name}!`,
      { duration: 5000 }
    )
    
    form.value = { name: '', email: '' }
  } catch (error) {
    notify.error(
      'Erro ao criar usuário',
      error.response?.data?.message || 'Tente novamente'
    )
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="Nome" />
    <input v-model="form.email" placeholder="Email" />
    <button :disabled="loading">
      {{ loading ? 'Salvando...' : 'Criar Usuário' }}
    </button>
  </form>
</template>
```

### 7. Em um Formulário de Configurações

```javascript
const handleSaveSettings = async () => {
  try {
    await saveSettings(settings.value)
    notify.success(
      'Configurações salvas',
      'Suas preferências foram atualizadas.',
      { duration: 3000 }
    )
  } catch (error) {
    notify.error('Erro ao salvar', 'Tente novamente mais tarde.')
  }
}
```

---

## 🎨 Customização

### Cores por Tipo

| Tipo      | Light Mode         | Dark Mode        | Ícone Padrão        |
| --------- | ------------------ | ---------------- | ------------------- |
| `success` | Green-50/200       | Green-950/800    | `pi-check-circle`   |
| `error`   | Red-50/200         | Red-950/800      | `pi-exclamation-circle` |
| `warning` | Yellow-50/200      | Yellow-950/800   | `pi-exclamation-triangle` |
| `info`    | Blue-50/200        | Blue-950/800     | `pi-info-circle`    |

### Customizar Cores (Tailwind)

Editar `src/components/NotificationCenter.vue`:

```javascript
const typeClasses = {
  success: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800',
  // ... adicionar ou modificar
}
```

### Customizar Duração Padrão

No `src/stores/notifications.js`:

```javascript
success: (title, message = '', options = {}) =>
  store.success(title, message, {
    duration: 3000,  // ← Mudar aqui
    ...options
  })
```

### Customizar Ícones

```javascript
notify.success('Sucesso', 'Operação concluída', {
  icon: 'pi-star'  // Usar outro ícone
})
```

**Ícones disponíveis:** https://www.primefaces.org/primevue/icons/

---

## 📚 API Reference

### `useNotifications()`

Retorna objeto com métodos abaixo.

#### `notify(config: Object): number`

Cria notificação customizada.

**Parâmetros:**
```typescript
{
  type?: 'success' | 'error' | 'warning' | 'info'  // default: 'info'
  title?: string                                    // default: ''
  message?: string                                  // default: ''
  duration?: number                                 // ms, default: 5000
  icon?: string                                     // PrimeIcons, optional
  onClose?: () => void                              // Callback, optional
}
```

**Retorna:** ID da notificação (número)

**Exemplo:**
```javascript
const id = notify.notify({
  type: 'info',
  title: 'Processando',
  message: 'Por favor aguarde...',
  duration: 0,
  onClose: () => console.log('Pronto!')
})
```

#### `success(title: string, message?: string, options?: Object): number`

Cria notificação de sucesso.

**Default:** `duration: 4000`, `icon: 'pi-check-circle'`

**Exemplo:**
```javascript
notify.success('Salvo!', 'Suas alterações foram salvas.')
```

#### `error(title: string, message?: string, options?: Object): number`

Cria notificação de erro.

**Default:** `duration: 6000`, `icon: 'pi-exclamation-circle'`

**Exemplo:**
```javascript
notify.error('Erro!', 'Algo deu errado.')
```

#### `warning(title: string, message?: string, options?: Object): number`

Cria notificação de aviso.

**Default:** `duration: 5000`, `icon: 'pi-exclamation-triangle'`

**Exemplo:**
```javascript
notify.warning('Atenção!', 'Cuidado ao prosseguir.')
```

#### `info(title: string, message?: string, options?: Object): number`

Cria notificação informativa.

**Default:** `duration: 4000`, `icon: 'pi-info-circle'`

**Exemplo:**
```javascript
notify.info('Informação', 'Apenas para informar.')
```

#### `remove(id: number): void`

Remove notificação específica.

**Exemplo:**
```javascript
const id = notify.success('Teste')
notify.remove(id)
```

#### `clearAll(): void`

Remove todas as notificações.

**Exemplo:**
```javascript
notify.clearAll()
```

#### `hasNotifications(): boolean`

Verifica se há notificações ativas.

**Exemplo:**
```javascript
if (notify.hasNotifications()) {
  console.log('Há notificações!')
}
```

#### `totalNotifications(): number`

Retorna quantidade de notificações ativas.

**Exemplo:**
```javascript
console.log(`${notify.totalNotifications()} notificações ativas`)
```

---

## 🎬 Animações

### Entrada
- **Duração:** 0.4s
- **Easing:** cubic-bezier(0.34, 1.56, 0.64, 1) (bounce)
- **Transformação:** Slide + rotate do lado direito

### Saída
- **Duração:** 0.3s
- **Easing:** cubic-bezier(0.4, 0, 1, 1) (ease-in)
- **Transformação:** Slide + rotate para direita

---

## 🔧 Troubleshooting

### Notificações não aparecem

1. Verifier se `NotificationCenter` está em `AppLayout.vue`
2. Verifier console para erros de import
3. Verifier se Pinia store está registrada

### Notificações desaparecem muito rápido

Aumentar duração:
```javascript
notify.success('Teste', 'Mensagem', { duration: 10000 })
```

### Dark mode não funciona

Verifier se Tailwind dark mode está configurado em `tailwind.config.js`.

### Ícones não aparecem

Verifier se PrimeIcons está carregado (deve estar em `main.js`).

---

## 📊 Performance

- **Bundle size adicionado:** ~5KB (minified)
- **Memory leak prevention:** Auto-garbage collection de notificações
- **Animações:** GPU-accelerated (usar `transform` e `opacity`)

---

## 🚀 Roadmap Futuro

- [ ] Persistência em localStorage
- [ ] Notificações de áudio
- [ ] Progresso visual (progress bar)
- [ ] Ações customizadas (botões na notificação)
- [ ] Sistema de prioridade
- [ ] Integração com Web Push API
- [ ] Notificações de desktop (quando tab inativa)

---

## 📄 Licença

Parte do projeto SYNVIA GIG Frontend.
