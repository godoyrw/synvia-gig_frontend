# SYNVIA™ Frontend | Interface Modular

## 🏗️ Arquitetura Modular

Este é o frontend da aplicação SYNVIA, construído com uma arquitetura modular que separa responsabilidades claras:

### 📁 Estrutura de Diretórios

```
src/
├── core/                    # Componentes e lógica compartilhada
│   ├── auth/               # Sistema de autenticação
│   ├── components/         # Componentes reutilizáveis
│   ├── config/             # Constantes e configurações
│   ├── layout/             # Layout e navegação
│   ├── router/             # Roteamento principal
│   └── services/           # Serviços compartilhados
├── modules/                 # Módulos de negócio
│   └── gig/                # Módulo GIG (Gestão Inteligente de Glosa)
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

```bash
# Instalar dependências
pnpm install

# Configurar ambiente
cp .env.example .env

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 🎯 Funcionalidades Principais

### 📊 Dashboard Interativo
- Visualizações avançadas com Apache ECharts
- Componentes base em `src/components/charts/BaseChart.vue`
- Dados mockados em `src/mock/data-dashboard.json`

### 📤 Upload de Arquivos CSV
- Interface responsiva com progresso em tempo real
- Validação client-side e server-side
- Upload para AWS S3 via micro-serviços

### �� Histórico de Importações
- Listagem paginada e filtrável
- Logs detalhados por arquivo
- Status de processamento em tempo real

## 🔧 Stack Tecnológica

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: PrimeVue (Tema Aura)
- **Styling**: Tailwind CSS + SCSS
- **State Management**: Pinia
- **Routing**: Vue Router (modular)
- **TypeScript**: Suporte completo

## 📖 Desenvolvimento

### Convenções de Código

- **Componentes**: Vue 3 com `<script setup>`
- **Roteamento**: Estrutura modular com lazy loading
- **Estado**: Pinia stores organizados por módulo
- **Styling**: PrimeVue + Tailwind + SCSS customizado
- **APIs**: Axios com interceptors centralizados

### Estrutura de Módulos

Cada módulo de negócio segue o padrão:

```
modules/{nome-modulo}/
├── router/routes.ts        # Definição de rotas
├── services/               # Lógica de negócio
├── stores/                 # Estado Pinia
└── views/                  # Componentes de página
```

### Configuração de Ambiente

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 📚 Documentação

- [Sistema de Sessões](src/assets/docs/synvia_session_management_report.html)
- [Importação de Arquivos](src/assets/docs/import_files.html)
- [Sistema de Logs](src/assets/docs/logs_implementados.html)
- [Configuração de Deploy](src/assets/docs/deployment_setup.html)
