# Synvia GIG – Monorepo# SYNVIA™ | The Intelligent Infrastructure for Health Management



Este repositório agora está dividido em duas aplicações:## Getting Started PNPM



| Diretório  | Descrição |```bash

| ---------- | --------- |# Install dependencies

| `/frontend` | Aplicação Vue 3 + Vite + PrimeVue (template Sakai). |pnpm install

| `/micro-services`  | Conjunto de micro-serviços Node.js + Express + TypeScript responsável pelo upload de CSV para o S3. |

# Start development server

## Pré-requisitospnpm dev



- Node.js 18+# Build for production

- pnpm (recomendado) ou npmpnpm build

- Credenciais AWS com permissão de `s3:PutObject````



## Micro-services
## Visualizações interativas com ECharts



```bashEste projeto agora utiliza [Apache ECharts](https://echarts.apache.org/) via [`vue-echarts`](https://github.com/ecomfe/vue-echarts) para suportar gráficos avançados (barras empilhadas, heatmap, treemap, etc.).

cd micro-services

pnpm install- Componentes base ficam em `src/components/charts/BaseChart.vue`.

cp .env.example .env # preencha credenciais AWS- Exemplos de uso e opções podem ser vistos em `src/views/SynviaGig.vue`, alimentados por `src/mock/data-dashboard.json`.

pnpm dev- Para criar um novo gráfico, importe `BaseChart` e forneça um objeto de opções ECharts:

```

	```vue

O servidor sobe, por padrão, na porta `3001` e expõe:	<BaseChart :option="myOption" height="320px" />

	```

- `POST /synvia-gig/import/upload` – upload e processamento de CSV.

- `GET /health` – verificação simples.### Desenvolvimento



## FrontendCaso tenha instalado as dependências antes da introdução dos gráficos, execute novamente:



```bash```bash

cd frontendpnpm install

pnpm install
cp .env.example .env # ajuste VITE_API_BASE_URL se necessário
pnpm dev
```

A UI abre em `http://localhost:5173` e se comunica com os micro-services via `VITE_API_BASE_URL`.

Consulte `frontend/README.md` para instruções detalhadas do app Sakai original.
