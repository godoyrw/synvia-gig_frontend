# 📋 Logs Implementados - Session Management

## ✅ Arquivos Atualizados

### 1. `src/stores/auth.js`
#### Logs Adicionados:

**`loginWithCredentials()`**
```js
console.log('[Auth] Login realizado com sucesso');
console.log('[Auth] Token expira em:', new Date(expiresAt).toLocaleString());
console.log('[Auth] Tempo até expiração:', `${durationMinutes} minutos`);
```

**`startHeartbeat()`**
```js
console.log('[Heartbeat] ✅ Iniciado. Intervalo:', intervalMs / 1000, 'segundos');
console.log('[Heartbeat] 💓 Check em', new Date(now).toLocaleTimeString(), '- Tempo restante:', timeRemainingSeconds, 'segundos');
console.log('[Heartbeat] ❌ Token expirado! Fazendo logout...');
```

**`logout()`**
```js
const logoutType = expired ? '⏰ Expiração' : '🚪 Logout Manual';
const agora = new Date().toLocaleTimeString();
console.log(`[Auth] ${logoutType} em ${agora}`);
```

**`stopHeartbeat()`**
```js
console.log('[Heartbeat] ⏹️  Parado em', new Date().toLocaleTimeString());
```

**`renewToken()`**
```js
console.log('[Auth] 🚫 Renovação bloqueada: usuário deslogado');
console.log('[Auth] 🔄 Token renovado. Novo tempo:', new Date(newExpiresAt).toLocaleTimeString());
console.error('[Auth] ❌ Erro ao renovar token:', err);
```

---

### 2. `src/composables/useActivityTracker.js`
#### Logs Adicionados:

**`startTracking()`**
```js
console.log('[ActivityTracker] 🎯 Rastreamento iniciado:', {
    invidadeMaximaSegundos: inactivityDurationMs / 1000,
    usuario: auth.user?.name || 'Desconhecido',
    tokenExpiresAt: new Date(auth.expiresAt).toLocaleTimeString()
});
```

**`resetInactivityTimer()`**
```js
console.log('[ActivityTracker] ⏰ Atividade detectada:', {
    timestamp: new Date(now).toLocaleTimeString(),
    tokenRenovado: new Date(newExpiresAt).toLocaleTimeString(),
    extensaoSegundos: timeExtended,
    durationMinutos: auth.durationMinutes
});
console.log('[ActivityTracker] ⚠️ Não autenticado ou expiresAt não existe');
console.log('[ActivityTracker] ❌ Inativo por', inactivityDurationMs / 1000, 'segundos. Logout em:', agora);
```

**`stopTracking()`**
```js
console.log('[ActivityTracker] 🛑 Rastreamento parado em', new Date().toLocaleTimeString());
```

---

### 3. `src/App.vue`
#### Logs Adicionados:

**`onMounted()`**
```js
console.log('[App] 🚀 Montado. Iniciando rastreamento...', {
    autenticado: auth.isAuthenticated,
    usuario: auth.user?.name,
    invidadeMinutos: auth.durationMinutes
});
console.log('[App] ⚠️ Não autenticado. ActivityTracker não iniciado.');
```

**`onUnmounted()`**
```js
console.log('[App] 👋 Desmontando. Parando rastreamento...');
```

---

### 4. `src/views/pages/auth/Login.vue`
#### Logs Adicionados:

**`handleLogin()`**
```js
console.log('[Login] 🔐 Tentando autenticar...', { email: email.value });
console.log('[Login] ✅ Autenticação realizada!');
console.log('[Login] 🔄 Redirecionando para:', redirect);
console.error('[Login] ❌ Erro:', err.message);
```

---

## 🎯 Como Usar os Logs

### Abra o Console do Browser
1. Pressione `F12` ou `Ctrl+Shift+I`
2. Vá até a aba **Console**
3. Procure por logs com os prefixos:
   - `[Auth]` - Autenticação e renovação
   - `[Heartbeat]` - Monitor de sessão
   - `[ActivityTracker]` - Rastreamento de atividade
   - `[App]` - Inicialização/Finalização
   - `[Login]` - Tela de login

### Filtrar Logs
```js
// Filtre por prefixo no console:
// Digite na barra de filtro: "[Auth]"
// Digite na barra de filtro: "[ActivityTracker]"
// Digite na barra de filtro: "[Heartbeat]"
```

---

## 🔍 O Que Observar

### ✅ Comportamento Correto

```
[Login] 🔐 Tentando autenticar... { email: 'test@example.com' }
↓
[Auth] Login realizado com sucesso
[Auth] Token expira em: 14:35:27
[Auth] Tempo até expiração: 2 minutos
[Heartbeat] ✅ Iniciado. Intervalo: 120 segundos
[Login] ✅ Autenticação realizada!
[Login] 🔄 Redirecionando para: /synvia-gig
↓
[App] 🚀 Montado. Iniciando rastreamento...
[ActivityTracker] 🎯 Rastreamento iniciado: { ... }
↓
(Cada clique/movimento)
[ActivityTracker] ⏰ Atividade detectada: {
    timestamp: 14:33:07,
    tokenRenovado: 14:35:07,
    extensaoSegundos: 120,
    durationMinutos: 2
}
```

### ❌ Sinais de Problema

- **ActivityTracker não aparece**: Não iniciou rastreamento (verifique se App.vue montou)
- **Sem atividade detectada**: Listeners não foram anexados (eventos não disparando)
- **Token não renova**: `auth.expiresAt` não está sendo atualizado
- **Logout imediato**: Heartbeat/inatividade triggering muito rápido
- **Sem check no Heartbeat**: Intervalo pode estar muito alto

---

## 📊 Fluxo Completo com Timing

```
00s  → Login bem-sucedido
     → Heartbeat inicia (check a cada 120s)
05s  → App monta
     → ActivityTracker inicia
     → resetInactivityTimer (primeiro call = renova token)

08s  → Usuário clica
     → ⏰ Atividade detectada
     → Token renovado (+120s)

15s  → Usuário move mouse
     → ⏰ Atividade detectada
     → Token renovado (+120s)

120s → Sem atividade
     → ❌ Inativo por 120 segundos
     → Logout automático
     → Heartbeat parado
     → ActivityTracker parado
     → Redireciona para login
```

---

## 🛠️ Para Remover Logs Depois

Se os logs ficarem muito verbosos em produção:

```bash
# Remove apenas prefixos específicos
grep -r "\[Auth\]" src/ --exclude-dir=node_modules

# Remove todos os console.log com prefixos
sed -i "/console\.log\(\'\[/d" src/**/*.js src/**/*.vue
```

Ou use uma ferramenta como `terser` com opção `drop_console`.

---

## 📝 Símbolos Usados

| Símbolo | Significado | Contexto |
|---------|------------|----------|
| 🔐 | Login | Início de autenticação |
| ✅ | Sucesso | Operação completada |
| ⏰ | Tempo/Atividade | Renovação de token |
| 💓 | Heartbeat | Check periódico |
| ❌ | Erro/Inatividade | Problema ou timeout |
| 🚪 | Logout | Saída do sistema |
| 🚫 | Bloqueado | Operação impedida |
| 🔄 | Renovação | Token refresh |
| 🛑 | Parado | Encerrado |
| 👋 | Finalização | Desmontagem |
| 🚀 | Inicialização | Startup |
| 🎯 | Rastreamento | ActivityTracker |
| ⚠️ | Aviso | Situação anômala |
| ⏹️ | Stop | Parada de processo |
