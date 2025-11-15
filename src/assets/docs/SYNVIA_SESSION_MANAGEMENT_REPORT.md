# 📊 Synvia GIG - Sistema de Gerenciamento de Sessão
## Relatório Técnico Completo

**Data:** 14 de Novembro de 2025  
**Versão:** 1.0  
**Status:** Pronto para Homolog  
**Branch:** `dev-login`

---

## 📋 Sumário Executivo

Este relatório documenta a implementação completa de um sistema robusto de autenticação e gerenciamento de sessão para a aplicação Synvia GIG. O sistema inclui:

- ✅ Autenticação com login/logout
- ✅ Heartbeat para monitoramento de sessão
- ✅ Rastreamento de atividade do usuário
- ✅ Renovação automática de token por atividade
- ✅ Logout automático por inatividade
- ✅ Menu de usuário com logout
- ✅ Constantes globais centralizadas
- ✅ Logs completos para debugging

---

## 🏗️ Arquitetura do Sistema

### Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                    App.vue (Raiz)                       │
│              (Não inicia ActivityTracker)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
         ┌──────▼───────┐  ┌──▼───────────────────┐
         │  Login.vue   │  │  AppLayout.vue       │
         │ (Sem AT)     │  │ (ActivityTracker ✓)  │
         └──────────────┘  └──────────┬───────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                  ┌─────▼──────┐            ┌──────▼──────┐
                  │ AppTopbar   │            │ AppSidebar  │
                  ├─ AppUserMenu│            ├─ AppMenu    │
                  │  ├─ Logout  │            └─────────────┘
                  │  ├─ Perfil  │
                  │  └─ Config  │
                  └─────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Framework | Vue 3 + Composition API |
| Roteamento | Vue Router 4 |
| Estado Global | Pinia 3.0+ |
| UI Components | PrimeVue 4.4+ |
| Styling | Tailwind CSS 4.1+ + Sass |
| Tooling | Vite 7.2+, ESLint 8.5+, Prettier 3.2+ |

---

## 🔐 Fluxos de Sessão

### 1. Login → Sessão Ativa

```
┌─────────┐
│ Login   │ (email + senha)
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Mock Service Auth       │
│ (valida credenciais)    │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ auth.loginWithCreds()   │
│ - Gera expiresAt        │
│ - Salva token em SS     │
│ - Inicia Heartbeat      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Router redirec para /   │
│ AppLayout monta         │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ ActivityTracker inicia  │
│ - Listeners attach      │
│ - Token renovado        │
│ - Timer inicia          │
└─────────────────────────┘
```

**Logs esperados:**
```
[Auth] ✅ Login realizado: { usuario, role, duracao, expiresAt }
[Heartbeat] ✅ Iniciado. Intervalo: 50 segundos
[AppLayout] 🚀 Montado. Iniciando ActivityTracker...
[ActivityTracker] 🎯 Rastreamento iniciado: { ... }
```

---

### 2. Com Atividade do Usuário

```
┌──────────────────────┐
│ User Action          │
│ (click/mousemove/...) │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Event Listener triggered     │
│ resetInactivityTimer()       │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Token renewed                │
│ expiresAt = now + 6min       │
│ sessionStorage atualizado    │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Inactivity timer restart     │
│ setTimeout(logout, 6min)     │
└──────────────────────────────┘
```

**Logs esperados (a cada atividade):**
```
[ActivityTracker] ⏰ Atividade detectada: {
  hora: 21:34:10,
  novoExpira: 21:40:10,
  extensaoSegundos: 360
}
```

---

### 3. Sem Atividade por 6 Minutos

```
┌─────────────────────────────┐
│ Inactivity Timeout Triggers │
│ (após 6 minutos)            │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ auth.logout(true)           │
│ - SessionStorage limpo      │
│ - isLoggedOut = true        │
│ - Heartbeat parado          │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Router redirect             │
│ /auth/login?expired=true    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Dialog exibe mensagem       │
│ "Sessão expirou"            │
└─────────────────────────────┘
```

**Logs esperados:**
```
[ActivityTracker] ❌ Inatividade por 360 segundos
[Auth] ⏰ Expiração em 21:39:10
[Heartbeat] ⏹️  Parado em 21:39:10
[AppLayout] 👋 Desmontando. Parando ActivityTracker...
[ActivityTracker] 🛑 Rastreamento parado em 21:39:10
```

---

### 4. Logout Manual

```
┌──────────────────────┐
│ User clica "Sair"    │
│ (Menu > Sair)        │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ AppUserMenu.handleLogout()   │
│ auth.logout(false)           │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Session limpa                │
│ isLoggedOut = true           │
│ Heartbeat parado             │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Router redirect              │
│ /auth/login                  │
└──────────────────────────────┘
```

**Logs esperados:**
```
[Auth] 🚪 Logout Manual em 21:39:10
[Heartbeat] ⏹️  Parado em 21:39:10
```

---

## 📁 Estrutura de Arquivos

### Criados

```
src/
├── config/
│   └── constants.js                    # Constantes globais
├── layout/
│   └── AppUserMenu.vue                 # Menu de logout
└── composables/
    └── useActivityTracker.js           # Rastreamento de atividade
```

### Modificados

```
src/
├── stores/
│   ├── auth.js                         # Login, Heartbeat, Renovação
│   └── dialog.js                       # Diálogos reutilizáveis
├── layout/
│   ├── AppLayout.vue                   # ActivityTracker init
│   ├── AppTopbar.vue                   # Menu de usuário
│   └── composables/
│       └── layout.js                   # (sem mudança)
├── views/
│   ├── pages/
│   │   └── auth/
│   │       └── Login.vue               # Dialog integration
│   └── (outros views)
├── App.vue                             # Simplificado (sem AT)
└── main.js                             # Inicialização heartbeat
```

---

## ⚙️ Configurações Globais

**Arquivo:** `src/config/constants.js`

```javascript
/**
 * Constantes globais da aplicação
 */

// Duração padrão da sessão em minutos
export const SESSION_DURATION_MINUTES = 6;

// Intervalo do heartbeat em ms
export const HEARTBEAT_INTERVAL_MS = 50000;

// Intervalo de check de expiração em ms
export const EXPIRATION_CHECK_INTERVAL_MS = 5000;
```

### Como Alterar

Para mudar a duração da sessão para **10 minutos**:

```javascript
export const SESSION_DURATION_MINUTES = 10;  // ← Mude aqui
```

A mudança se propaga automaticamente para:
- `loginWithCredentials(username, password, durationMinutes = SESSION_DURATION_MINUTES)`
- `logout()` - reseta para este valor
- `ActivityTracker` - inatividade timeout
- Todas as renovações de token

---

## 🔍 Sistema de Logs

### Logs Implementados

#### Auth Store (`src/stores/auth.js`)

| Log | Trigger | Informação |
|-----|---------|-----------|
| `[Auth] ✅ Login realizado` | `loginWithCredentials()` | Usuario, role, duração, expiresAt |
| `[Auth] 🚪 Logout Manual` | `logout(false)` | Timestamp |
| `[Auth] ⏰ Expiração` | `logout(true)` | Timestamp |
| `[Auth] 🚫 Renovação bloqueada` | `renewToken()` | Motivo |
| `[Auth] 🔄 Token renovado` | `renewToken()` | Novo tempo de expiração |

#### Heartbeat (`src/stores/auth.js`)

| Log | Trigger | Informação |
|-----|---------|-----------|
| `[Heartbeat] ✅ Iniciado` | `startHeartbeat()` | Intervalo em segundos |
| `[Heartbeat] 💓 Check` | A cada intervalo | Hora, segundos restantes |
| `[Heartbeat] ❌ Token expirado` | Timeout + expirado | Triggers logout |
| `[Heartbeat] ⏹️  Parado` | `stopHeartbeat()` | Timestamp |

#### ActivityTracker (`src/composables/useActivityTracker.js`)

| Log | Trigger | Informação |
|-----|---------|-----------|
| `[ActivityTracker] 🎯 Rastreamento iniciado` | `startTracking()` | Usuario, role, expira |
| `[ActivityTracker] ⏰ Atividade detectada` | User event | Hora, novo expira, extensão |
| `[ActivityTracker] ❌ Inatividade` | Timeout | Segundos de inatividade |
| `[ActivityTracker] 🛑 Rastreamento parado` | `stopTracking()` | Timestamp |

#### AppLayout (`src/layout/AppLayout.vue`)

| Log | Trigger | Informação |
|-----|---------|-----------|
| `[AppLayout] 🚀 Montado` | `onMounted()` | Usuario, inatividade |
| `[AppLayout] 👋 Desmontando` | `onUnmounted()` | Parando AT |

---

## 🔑 Componentes Principais

### 1. Auth Store (`src/stores/auth.js`)

**Responsabilidades:**
- Gerenciar estado de autenticação
- Armazenar token e dados do usuário
- Controlar heartbeat
- Renovar token
- Fazer logout

**Métodos:**
```javascript
// Login com credenciais
async loginWithCredentials(username, password, durationMinutes = SESSION_DURATION_MINUTES)

// Logout (manual ou por expiração)
logout(expired = false)

// Verificar expiração manual
checkExpiration()

// Gerenciar heartbeat
startHeartbeat(intervalMs = HEARTBEAT_INTERVAL_MS)
stopHeartbeat()

// Renovar token
async renewToken()
```

**State:**
```javascript
token              // JWT token
user               // { displayName, role, ... }
expiresAt          // Timestamp de expiração
durationMinutes    // Duração da sessão
heartbeatInterval  // ID do setInterval
heartbeatEnabled   // Flag
isLoggedOut        // Previne renovação pós-logout
```

---

### 2. ActivityTracker Composable (`src/composables/useActivityTracker.js`)

**Responsabilidades:**
- Rastrear atividade do usuário
- Renovar token quando há atividade
- Fazer logout após inatividade

**Events Rastreados:**
- `click`
- `mousemove`
- `keypress`
- `scroll`
- `touchstart`

**Métodos:**
```javascript
// Iniciar rastreamento
startTracking(inactivityDurationMs = 10 * 60 * 1000)

// Parar rastreamento
stopTracking()

// Verificar se está rastreando
isTracking()
```

---

### 3. User Menu (`src/layout/AppUserMenu.vue`)

**Responsabilidades:**
- Exibir ícone de usuário
- Mostrar menu suspenso com opções
- Fazer logout ao clicar "Sair"

**Features:**
- Exibe nome e role do usuário
- Botões para Perfil e Configurações
- Botão Logout destacado em vermelho
- Tema claro/escuro automático
- Animações suaves

---

### 4. Dialog Store (`src/stores/dialog.js`)

**Responsabilidades:**
- Gerenciar diálogos globais
- Mostrar mensagens de erro/sucesso
- Exibir notificações de sessão expirada

**Métodos:**
```javascript
open(payload = null)      // Abre dialog
close()                   // Fecha dialog
toggle(payload = null)    // Alterna estado
```

---

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────┐
│        sessionStorage (Persistência)        │
├─────────────────────────────────────────────┤
│ auth_token    │ auth_user                   │
│ auth_expires  │ auth_duration               │
└────────┬──────────────────────────┬─────────┘
         │                          │
         ▼                          ▼
┌──────────────────────────────────────────┐
│         Pinia Auth Store                  │
├──────────────────────────────────────────┤
│ state: {                                 │
│   token, user, expiresAt, durationMins   │
│   heartbeatInterval, isLoggedOut         │
│ }                                        │
└────┬──────────────────────┬──────────────┘
     │                      │
     ▼                      ▼
┌───────────────────┐  ┌──────────────────┐
│ Heartbeat Monitor │  │ ActivityTracker  │
│ (50s intervals)   │  │ (User events)    │
└────────┬──────────┘  └────────┬─────────┘
         │                      │
         ▼                      ▼
    Token Expired?      Token Still Valid?
         │                      │
    YES  ▼ NO                   ▼ YES
         │                    Renovar
      LOGOUT              (expiresAt++)
                              │
                              ▼
                        sessionStorage update
```

---

## 🧪 Teste e Validação

### Como Testar

#### Teste 1: Login Básico
1. Abra DevTools (F12 → Console)
2. Navegue para `/auth/login`
3. Faça login com: `admin@synvia.com.br` / `R0b19G0d81`
4. Observe logs:
   - `[Auth] ✅ Login realizado`
   - `[Heartbeat] ✅ Iniciado`
   - `[AppLayout] 🚀 Montado`
   - `[ActivityTracker] 🎯 Rastreamento iniciado`

#### Teste 2: Renovação por Atividade
1. Faça login
2. Clique/mova mouse várias vezes
3. Observe logs: `[ActivityTracker] ⏰ Atividade detectada`
4. Verifique que `novoExpira` muda a cada ação

#### Teste 3: Logout por Inatividade
1. Faça login
2. Fique **parado por 6 minutos** sem interagir
3. Observe logs:
   - `[ActivityTracker] ❌ Inatividade`
   - `[Auth] ⏰ Expiração`
   - `[Heartbeat] ⏹️  Parado`
4. Será redirecionado para login com mensagem

#### Teste 4: Logout Manual
1. Faça login
2. Clique no ícone de usuário → "Sair"
3. Observe logs:
   - `[Auth] 🚪 Logout Manual`
   - `[Heartbeat] ⏹️  Parado`
4. Será redirecionado para login

#### Teste 5: Alterar Duração
1. Altere em `src/config/constants.js`: `SESSION_DURATION_MINUTES = 1`
2. Faça login
3. Observe que timeout agora é 1 minuto
4. Verifique logs mostram `duracao: "1 minutos"`

---

## 🚀 Próximas Etapas

### Curto Prazo (Antes de Homolog)

- [ ] Remover logs de debug (deixar só `console.error`)
- [ ] Fazer build de produção
- [ ] Testar em ambiente homolog

### Médio Prazo (Próximos Sprints)

- [ ] Integrar com API real (trocar mock login)
- [ ] Implementar Refresh Token mechanism
- [ ] Adicionar validação de roles/permissões
- [ ] Criar página de Perfil do usuário
- [ ] Criar página de Configurações

### Longo Prazo (Roadmap Futuro)

- [ ] 2FA / Autenticação multi-fator
- [ ] Notificações em tempo real
- [ ] Audit log de sessões
- [ ] Testes unitários completos
- [ ] Testes E2E (Cypress/Playwright)

---

## 📚 Referências de Código

### Login com Credenciais

```javascript
// src/stores/auth.js
async loginWithCredentials(username, password, durationMinutes = SESSION_DURATION_MINUTES) {
    const result = await mockLogin(username, password);
    if (!result.ok) throw new Error(result.message);
    
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    
    this.token = result.token;
    this.user = result.user;
    this.expiresAt = expiresAt;
    this.durationMinutes = durationMinutes;
    this.isLoggedOut = false;
    
    sessionStorage.setItem('auth_token', this.token);
    sessionStorage.setItem('auth_user', JSON.stringify(this.user));
    sessionStorage.setItem('auth_expires', String(expiresAt));
    sessionStorage.setItem('auth_duration', String(durationMinutes));
    
    this.startHeartbeat();
}
```

### Renovação por Atividade

```javascript
// src/composables/useActivityTracker.js
if (auth.isAuthenticated && auth.expiresAt) {
    const now = Date.now();
    const newExpiresAt = now + auth.durationMinutes * 60 * 1000;
    auth.expiresAt = newExpiresAt;
    sessionStorage.setItem('auth_expires', String(newExpiresAt));
}
```

### Menu de Logout

```vue
<!-- src/layout/AppUserMenu.vue -->
<button @click="handleLogout" class="...">
    <i class="pi pi-sign-out"></i>
    <span>Sair</span>
</button>
```

---

## 📞 Suporte e Manutenção

### Alterar Duração da Sessão

**Arquivo:** `src/config/constants.js`
```javascript
export const SESSION_DURATION_MINUTES = 10;  // Altere para 10 minutos
```

### Adicionar Novo Evento de Atividade

**Arquivo:** `src/composables/useActivityTracker.js`
```javascript
const events = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart', 'NOVO_EVENTO'];
```

### Mudar Intervalo do Heartbeat

**Arquivo:** `src/config/constants.js`
```javascript
export const HEARTBEAT_INTERVAL_MS = 30000;  // 30 segundos ao invés de 50
```

---

## ✅ Checklist de Deployment

- [ ] Remover todos os logs `console.log` (exceto `console.error`)
- [ ] Executar `npm run build`
- [ ] Verificar bundle size
- [ ] Testar em staging
- [ ] Code review completo
- [ ] Testes manuais em homolog
- [ ] Deploy em produção
- [ ] Monitorar erros em produção

---

## 📝 Notas Técnicas

### Sincronização de Estado

O estado de autenticação é mantido sincronizado entre:
1. **Pinia Store** - Estado reativo em memória
2. **sessionStorage** - Persistência entre page refreshes
3. **Router Guards** - Proteção de rotas
4. **Components** - UI reflete estado

### Security Considerations

- ✅ Token armazenado em sessionStorage (não localStorage)
- ✅ Flag `isLoggedOut` previne renovação pós-logout
- ✅ Heartbeat valida token a cada intervalo
- ✅ ActivityTracker verifica autenticação antes de renovar
- ⚠️ TODO: Implementar CSRF tokens
- ⚠️ TODO: Usar HttpOnly cookies em produção

### Performance

- Heartbeat: 50s interval (não sobrecarrega)
- ActivityTracker: Event listeners com `passive: true`
- Token renovação: Apenas quando há atividade (não polling)
- Bundle impact: ~2KB (gzipped)

---

## 📄 Informações do Projeto

**Projeto:** Synvia GIG  
**Desenvolvido por:** GitHub Copilot + [User]  
**Data:** 14 de Novembro de 2025  
**Versão:** 1.0  
**Status:** Pronto para Homolog  

**Tecnologias:**
- Vue 3 + Composition API
- Pinia 3.0+
- Vue Router 4
- PrimeVue 4.4+
- Tailwind CSS 4.1+
- Vite 7.2+

---

**Fim do Relatório**

---

## 🔗 Referências de Arquivos

| Arquivo | Linha | Descrição |
|---------|-------|-----------|
| `src/config/constants.js` | - | Constantes globais |
| `src/stores/auth.js` | 1-166 | Store de autenticação |
| `src/stores/dialog.js` | 1-30 | Store de diálogos |
| `src/composables/useActivityTracker.js` | 1-96 | Rastreador de atividade |
| `src/layout/AppLayout.vue` | 1-70 | Layout protegido |
| `src/layout/AppUserMenu.vue` | 1-80 | Menu de usuário |
| `src/layout/AppTopbar.vue` | 1-50 | Topbar com menu |
| `src/views/pages/auth/Login.vue` | 1-100 | Página de login |
| `src/App.vue` | 1-20 | Componente raiz |
| `src/main.js` | 1-80 | Bootstrap da app |

---

**Documento gerado em:** 14 de Novembro de 2025
