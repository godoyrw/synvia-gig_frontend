# SYNVIA™ | The Intelligent Infrastructure for Health Management

## 🏗️ Arquitetura Modular

Este repositório está organizado como um **monorepo** com duas aplicações independentes:

| Diretório | Descrição | Stack Tecnológica |
| ---------- | --------- | ----------------- |
| `frontend/` | Interface web responsiva com arquitetura modular | Vue 3 + Vite + PrimeVue + TypeScript |
| `micro-services/` | API backend para processamento de arquivos CSV | Node.js 18 + Express + TypeScript + AWS S3 |

### 📁 Estrutura Modular do Frontend

```
frontend/src/
├── core/                    # Componentes e lógica compartilhada
│   ├── auth/               # Sistema de autenticação
│   ├── components/         # Componentes reutilizáveis
│   ├── config/             # Constantes e configurações
│   ├── layout/             # Layout e navegação
│   ├── router/             # Roteamento principal
│   └── services/           # Serviços compartilhados
├── modules/                 # Módulos de negócio
│   └── gig/                # Módulo GIG (upload/histórico)
│       ├── router/         # Rotas do módulo
│       ├── services/       # Serviços específicos
│       ├── stores/         # Estado Pinia
│       └── views/          # Páginas do módulo
├── assets/                  # Recursos estáticos
├── mock/                    # Dados de desenvolvimento
├── services/                # Serviços globais
├── stores/                  # Estado global
└── views/                   # Páginas compartilhadas
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm
- Credenciais AWS com permissão `s3:PutObject`

### Instalação e Execução

```bash
# Instalar dependências
pnpm install

# Configurar ambiente
cp frontend/.env.example frontend/.env
cp micro-services/.env.example micro-services/.env

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 🎯 Funcionalidades

### 📊 Dashboard Interativo

- Visualizações avançadas com Apache ECharts
- Componentes base em `src/components/charts/BaseChart.vue`
- Dados mockados em `src/mock/data-dashboard.json`

### 📤 Upload de Arquivos CSV

- Validação e processamento no backend
- Upload para AWS S3 com metadados
- Interface responsiva com progresso em tempo real

### 📋 Histórico de Importações

- Listagem paginada e filtrável
- Logs detalhados por arquivo
- Status de processamento em tempo real

## 🔧 Desenvolvimento

### Frontend

```bash
cd frontend
pnpm install
pnpm dev  # http://localhost:5173
```

### Micro-serviços

```bash
cd micro-services
pnpm install
pnpm dev  # http://localhost:3001
```

### 📚 APIs Disponíveis

- `POST /gig/import/upload` – Upload e processamento de CSV
- `GET /gig/import/history` – Histórico de importações
- `GET /health` – Verificação de saúde do serviço

## 📖 Documentação

- [Configuração de Deploy](frontend/DEPLOYMENT_SETUP.md)
- [Sistema de Sessões](frontend/src/assets/docs/synvia_session_management_report.html)
- [Importação de Arquivos](frontend/src/assets/docs/import_files.html)
- [Sistema de Logs](frontend/src/assets/docs/logs_implementados.html)

## 🏷️ Convenções

- **Backend**: TypeScript obrigatório (`src/**/*.ts`)
- **Frontend**: Vue 3 com Composition API + `<script setup>`
- **Roteamento**: Estrutura modular com lazy loading
- **Estado**: Pinia para gerenciamento de estado
- **Styling**: PrimeVue + Tailwind CSS + SCSS customizado
