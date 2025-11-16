# SYNVIA™ | The Intelligent Infrastructure for Health Management

## Getting Started PNPM

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Visualizações interativas com ECharts

Este projeto agora utiliza [Apache ECharts](https://echarts.apache.org/) via [`vue-echarts`](https://github.com/ecomfe/vue-echarts) para suportar gráficos avançados (barras empilhadas, heatmap, treemap, etc.).

- Componentes base ficam em `src/components/charts/BaseChart.vue`.
- Exemplos de uso e opções podem ser vistos em `src/views/SynviaGig.vue`, alimentados por `src/mock/data-dashboard.json`.
- Para criar um novo gráfico, importe `BaseChart` e forneça um objeto de opções ECharts:

	```vue
	<BaseChart :option="myOption" height="320px" />
	```

### Desenvolvimento

Caso tenha instalado as dependências antes da introdução dos gráficos, execute novamente:

```bash
pnpm install
