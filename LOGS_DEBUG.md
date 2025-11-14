# 📊 Guia de Logs de Debug - Session Management

## Fluxo de Logs Esperados

### 1️⃣ Login

```js
[Login] 🔐 Tentando autenticar... { email: 'user@example.com' }
[Auth] Login realizado com sucesso
[Auth] Token expira em: 14:35:27
[Auth] Tempo até expiração: 2 minutos
[Heartbeat] ✅ Iniciado. Intervalo: 120 segundos
[Login] ✅ Autenticação realizada!
[Login] 🔄 Redirecionando para: /synvia-gig
```

### 2️⃣ App.vue Monta

```js
[App] 🚀 Montado. Iniciando rastreamento... {
  autenticado: true,
  usuario: 'John Doe',
  invidadeMinutos: 2
}
[ActivityTracker] 🎯 Rastreamento iniciado: {
  invidadeMaximaSegundos: 120,
  usuario: 'John Doe',
  tokenExpiresAt: 14:35:27
}
[ActivityTracker] ⏰ Atividade detectada: {
  timestamp: 14:33:07,
  tokenRenovado: 14:35:07,
  extensaoSegundos: 120,
  durationMinutos: 2
}
```

### 3️⃣ Heartbeat Check (a cada 2 minutos)

```js
[Heartbeat] 💓 Check em 14:35:27 - Tempo restante: 120 segundos
[Heartbeat] 💓 Check em 14:37:27 - Tempo restante: 0 segundos
```

### 4️⃣ Com Atividade do Usuário

```js
[ActivityTracker] ⏰ Atividade detectada: {
  timestamp: 14:34:15,
  tokenRenovado: 14:36:15,
  extensaoSegundos: 120,
  durationMinutos: 2
}
[ActivityTracker] ⏰ Atividade detectada: {
  timestamp: 14:34:22,
  tokenRenovado: 14:36:22,
  extensaoSegundos: 120,
  durationMinutos: 2
}
```

### 5️⃣ Logout por Inatividade

```js
[ActivityTracker] ❌ Inativo por 120 segundos. Logout em: 14:35:27
[Auth] ⏰ Expiração em 14:35:27
[Heartbeat] ⏹️  Parado em 14:35:27
[ActivityTracker] 🛑 Rastreamento parado em 14:35:27
[App] 👋 Desmontando. Parando rastreamento...
```

### 6️⃣ Logout Manual

```js
[Auth] 🚪 Logout Manual em 14:35:27
[Heartbeat] ⏹️  Parado em 14:35:27
```

---

## 🔍 O Que Rastrear

### ✅ Comportamento Correto

- [ ] Login → Heartbeat inicia
- [ ] App monta → ActivityTracker inicia
- [ ] A cada atividade → Token renovado
- [ ] Nenhuma atividade por 2 min → Logout automático
- [ ] Com atividade contínua → Token renovado continuamente

### ❌ Problemas a Detectar

- [ ] ActivityTracker não inicia após login
- [ ] Token expira sem motivo
- [ ] Logout sem mensagem de inatividade
- [ ] Logs mostram atividade mas token não renova
- [ ] Heartbeat não para ao logout

---

## 🎯 Teste Sugerido

### Cenário 1: Logout por Inatividade (2 min)

1. Faça login
2. Observe `[ActivityTracker] ⏰ Atividade detectada` no primeiro click
3. Fique parado por 2 minutos
4. Veja `[ActivityTracker] ❌ Inativo por 120 segundos`
5. Deve ser redirecionado para login

### Cenário 2: Token Renovado com Atividade

1. Faça login
2. Clique/mova mouse regularmente
3. Observe `[ActivityTracker] ⏰ Atividade detectada` a cada ação
4. Token deve ser renovado sempre
5. Não deve fazer logout

### Cenário 3: Heartbeat como Backup

1. Faça login
2. Fique inativo por 2 min 30 seg
3. Veja `[ActivityTracker] ❌ Inativo` primeiro
4. Ou `[Heartbeat] 💓 Check` com 0 segundos restantes

---

## 📝 Resumo dos Símbolos de Log

- 🔐 Login iniciado
- ✅ Sucesso/Autenticado
- ⏰ Atividade/Token renovado
- 💓 Heartbeat check
- ❌ Inatividade/Logout por timeout
- 🚪 Logout manual
- 🚫 Bloqueado
- 🔄 Renovação
- 🛑 Parado
- 👋 Finalização
- 🚀 Inicializado
- 🎯 Rastreamento iniciado
- ⚠️ Aviso
- ⏹️ Parado

