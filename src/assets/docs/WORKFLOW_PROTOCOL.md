# 📋 Protocolo de Trabalho - GitHub Copilot + Desenvolvedor

## 🎯 Objetivo
Documentar as linhas de trabalho e fluxo de comunicação entre o GitHub Copilot (Assistente IA) e o desenvolvedor.

---

## ✅ O QUE O COPILOT FAZ

### Implementação de Código
- ✅ Criar novos arquivos
- ✅ Editar arquivos existentes
- ✅ Implementar features e componentes
- ✅ Refatorar código
- ✅ Debugar problemas

### Validação
- ✅ Rodar build (`npm run build`)
- ✅ Verificar erros (`eslint`, `type checking`)
- ✅ Testar código (se aplicável)
- ✅ Informar status e problemas

### Pesquisa e Análise
- ✅ Ler arquivos do projeto
- ✅ Analisar código existente
- ✅ Buscar padrões e implementações
- ✅ Documentar mudanças

---

## ❌ O QUE O COPILOT NÃO FAZ (sem solicitação explícita)

### Git Operations
- ❌ **SEM commit automático** - Só quando você pedir: "**faz commit disso**"
- ❌ **SEM push automático** - Só quando você pedir: "**dá push**"
- ❌ **SEM pull/rebase automático** - Só quando necessário e você autorizar

### Pull Requests
- ❌ **SEM PR automático** - Só quando você pedir: "**abre um PR**"
- ❌ **SEM merge automático** - Só quando você pedir: "**faz merge**"
- ❌ **TODOS os PRs para `homolog`** - Nunca para `production`

### Operações Destrutivas
- ❌ SEM hard reset
- ❌ SEM force push
- ❌ SEM deletar branches

---

## 🗣️ Como Solicitar Operações

### Commit
```
"faz commit disso"
"comita com mensagem: 'feat: implementar xyz'"
"comita as mudanças"
```

### Push
```
"dá push"
"faz push do dev-login"
"envia pro repositório"
```

### Pull Request
```
"abre um PR"
"cria uma PR para homolog"
"abre PR com título 'feat: xyz' na homolog"
```

### Merge
```
"faz merge"
"merge dessa branch"
"merge para homolog"
```

---

## 📊 Fluxo Padrão de Trabalho

```
1️⃣ VOCÊ: "implementa uma feature xyz"
   ↓
2️⃣ COPILOT: Cria/edita arquivos, valida build, informa quando pronto
   ↓
3️⃣ VOCÊ: Revisa o código no editor
   ↓
4️⃣ VOCÊ: "faz commit disso"
   ↓
5️⃣ COPILOT: Faz o commit
   ↓
6️⃣ VOCÊ: "dá push"
   ↓
7️⃣ COPILOT: Faz o push
   ↓
8️⃣ VOCÊ: "abre uma PR para homolog"
   ↓
9️⃣ COPILOT: Abre PR para homolog (nunca production)
   ↓
🔟 VOCÊ: Revisa PR, aprova, faz merge no GitHub ou pede ao Copilot
```

---

## 🚫 Branches Seguras

### ✅ Posso trabalhar livremente
- `dev-login` ← Branch de trabalho atual
- `feature/*` ← Feature branches
- Qualquer branch exceto `production`

### ⛔ Nunca toco sem sua aprovação
- `production` ← Production (nunca!)
- `main` ← Pode existir, precisa de autorização
- `master` ← Pode existir, precisa de autorização

---

## 📝 Regras de PR

| Regra | Status |
|-------|--------|
| PRs sempre para `homolog` | 🟢 OBRIGATÓRIO |
| PRs nunca para `production` | 🔴 PROIBIDO |
| PR sem solicitação explícita | 🔴 PROIBIDO |
| Commit sem solicitação explícita | 🔴 PROIBIDO |
| Push sem solicitação explícita | 🔴 PROIBIDO |

---

## 💬 Exemplos de Comunicação

### ✅ Correto
```
VOCÊ: "implementa uma página de login"
COPILOT: [cria files, valida build] 
         "Pronto! Criei a página de Login com validação e notificações. 
          Build passou com 587kb (gzip 129kb). Quando quiser, é só pedir 
          para fazer commit."

VOCÊ: "faz commit"
COPILOT: [faz commit] "✅ Commit realizado: 'feat: implementar página de login'"

VOCÊ: "dá push"
COPILOT: [faz push] "✅ Push realizado para dev-login"

VOCÊ: "abre um PR para homolog"
COPILOT: [abre PR] "✅ PR #xyz criada para homolog"
```

### ❌ Errado
```
VOCÊ: "implementa uma página de login"
COPILOT: [cria files, valida build, faz commit, faz push, abre PR, faz merge]
         ❌ NÃO! Não faço nada disso sem você pedir!
```

---

## 📍 Status de Cada Mudança

Ao terminar uma implementação, informo:

```
✅ Implementação concluída:
   - Arquivos criados/modificados: [lista]
   - Build: ✅ Passou (587kb / 129kb gzip)
   - Erros: ❌ Nenhum
   - Próximo passo: Aguardando seu comando (commit/push/PR?)
```

---

## 🔄 Sincronização com Remoto

Se houver conflitos ou mudanças remotas:
- ℹ️ Informo que há mudanças remotas
- ❓ Pergunto se quer fazer `git pull`
- ⏳ Aguardo sua autorização antes de fazer qualquer operação

---

## 📌 Resumo Rápido

| Ação | Precisa pedir? |
|------|---|
| Implementar código | ❌ Não (faço automático) |
| Validar build | ❌ Não (faço automático) |
| Fazer commit | ✅ SIM |
| Fazer push | ✅ SIM |
| Abrir PR | ✅ SIM |
| Fazer merge | ✅ SIM |
| Deletar branches | ✅ SIM |
| Mexer em production | ✅✅ SIM (DUPLO!) |

---

## 👥 Contato de Mudanças

Se você fizer mudanças no repositório (fora do Copilot):
- Informo quando detectar
- Proponho `git pull` se necessário
- Aguardo sua autorização

---

**Última atualização:** 15 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Ativo
