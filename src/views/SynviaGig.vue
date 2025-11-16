<script setup>
import synviaGigLogo from '@/assets/images/logos/synvia_gig_positivo.png';
import BaseChart from '@/components/charts/BaseChart.vue';
import dashboardData from '@/mock/data-dashboard.json';
import { computed } from 'vue';

const statusDataset = dashboardData.rankingStatusItem.data;
const prestadorDataset = dashboardData.rankingPrestadorStatusItem.data;

const totals = computed(() =>
    statusDataset.reduce(
        (acc, item) => {
            acc.liberado += item['Valor Liberado Item'];
            acc.glosa += item['Valor Glosa Item'];
            acc.qtd += item.Qtd;
            return acc;
        },
        { liberado: 0, glosa: 0, qtd: 0 }
    )
);

const glosaRate = computed(() => {
    const { liberado, glosa } = totals.value;
    const denom = liberado + glosa;
    if (!denom) return 0;
    return glosa / denom;
});

const ticketMedio = computed(() => {
    const { liberado, qtd } = totals.value;
    if (!qtd) return 0;
    return liberado / qtd;
});

const receitaProjetada = computed(() => totals.value.liberado - totals.value.glosa);

const kpiCards = computed(() => [
    {
        label: 'Taxa de Glosa',
        value: formatPercent(glosaRate.value),
        trend: '-2,1% vs mês anterior',
        intent: 'danger'
    },
    {
        label: 'Ticket médio liberado',
        value: formatCurrency(ticketMedio.value),
        trend: '+4,2% vs mês anterior',
        intent: 'success'
    },
    {
        label: 'Itens processados',
        value: totals.value.qtd.toLocaleString('pt-BR'),
        trend: '+1,6k novos itens',
        intent: 'info'
    }
]);

const statusOption = computed(() => {
  const statuses = statusDataset.map((item) => item['Status Item']);

  return {
    textStyle: { color: '#C7E6E7' },
    color: ['#34d399', '#f87171', '#fbbf24'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(5,31,33,0.95)',
      borderWidth: 0,
      textStyle: { color: '#E8F5F5' },
      valueFormatter: (value) => formatCurrency(value)
    },
    legend: {
      top: 16,
      textStyle: { color: '#C7E6E7' }
    },
    grid: { left: 48, right: 48, top: 80, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: statuses,
      axisLabel: { interval: 0, color: '#8BCBCD' },
      axisLine: { lineStyle: { color: '#083033' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: '#8BCBCD',
          formatter: (value) => formatCompact(value)
        },
        splitLine: { lineStyle: { color: 'rgba(139,203,205,0.15)' } }
      },
      {
        type: 'value',
        axisLabel: {
          color: '#8BCBCD',
          formatter: (value) => value.toLocaleString('pt-BR')
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Valor Liberado',
        type: 'bar',
        stack: 'valor',
        barWidth: 24,
        emphasis: { focus: 'series' },
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: statusDataset.map((item) => item['Valor Liberado Item'])
      },
      {
        name: 'Valor Glosa',
        type: 'bar',
        stack: 'valor',
        barWidth: 24,
        emphasis: { focus: 'series' },
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: statusDataset.map((item) => item['Valor Glosa Item'])
      },
      {
        name: 'Quantidade',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#52AEB0' },
        itemStyle: { color: '#52AEB0' },
        data: statusDataset.map((item) => item.Qtd)
      }
    ]
  };
});

const heatmapStatuses = [...new Set(prestadorDataset.map((item) => item['Status Item']))];

const topPrestadores = computed(() => {
    const totalsByPrestador = prestadorDataset.reduce((acc, item) => {
        acc[item.Prestador] = (acc[item.Prestador] ?? 0) + item['Valor Glosa Item'];
        return acc;
    }, {});

    return Object.entries(totalsByPrestador)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([prestador]) => prestador);
});

const prestadorHeatmapOption = computed(() => {
    let maxValue = 0;
    const matrix = [];

    topPrestadores.value.forEach((prestador, rowIndex) => {
        heatmapStatuses.forEach((status, colIndex) => {
            const match = prestadorDataset.find(
                (item) => item.Prestador === prestador && item['Status Item'] === status
            );
            const value = match ? match['Valor Glosa Item'] : 0;
            maxValue = Math.max(maxValue, value);
            matrix.push([colIndex, rowIndex, value]);
        });
    });

  return {
    textStyle: { color: '#C7E6E7' },
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(5,31,33,0.95)',
      borderWidth: 0,
      formatter: ({ value }) => {
        const [colIndex, rowIndex, val] = value;
        return `${topPrestadores.value[rowIndex]}<br/>${heatmapStatuses[colIndex]}: ${formatCurrency(val)}`;
      }
    },
    grid: { left: 150, right: 24, top: 72, bottom: 80 },
    xAxis: {
      type: 'category',
      data: heatmapStatuses,
      axisLabel: { rotate: 30, color: '#8BCBCD' },
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: topPrestadores.value,
      axisLabel: { color: '#C7E6E7' },
      inverse: true,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      inRange: { color: ['#051F21', '#146E6F', '#52AEB0'] },
      text: ['Alto', 'Baixo'],
      formatter: (value) => formatCompact(value)
    },
    series: [
      {
        name: 'Valor Glosa',
        type: 'heatmap',
        data: matrix,
        label: {
          show: true,
          color: '#E8F5F5',
          formatter: ({ value }) => formatCompact(value[2])
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.35)'
          }
        }
      }
    ]
  };
});

const timelinePalette = {
    Recursado: {
        icon: 'pi pi-arrow-up-right',
        variant: 'positive',
        sign: '+'
    },
    'Glosa Aceita': {
        icon: 'pi pi-arrow-down-right',
        variant: 'negative',
        sign: '-'
    },
    Cancelado: {
        icon: 'pi pi-times-circle',
        variant: 'warning',
        sign: '-'
    },
    'Tratativas Cliente': {
        icon: 'pi pi-comments',
        variant: 'neutral',
        sign: '-'
    }
};

const referenceDates = [
    '13 Jun 2025 · 11:09',
    '13 Jun 2025 · 08:22',
    '12 Jun 2025 · 14:56',
    '12 Jun 2025 · 06:11',
    '11 Jun 2025 · 03:50',
    '10 Jun 2025 · 21:54',
    '09 Jun 2025 · 18:40',
    '08 Jun 2025 · 09:24'
];

const timelineItems = computed(() => {
    const sorted = [...prestadorDataset].sort(
        (a, b) => b['Valor Glosa Item'] - a['Valor Glosa Item']
    );

    return sorted.slice(0, 8).map((entry, index) => {
        const palette = timelinePalette[entry['Status Item']] ?? {
            icon: 'pi pi-circle',
            variant: 'neutral',
            sign: ''
        };

        return {
            id: `${entry.Prestador}-${entry['Status Item']}-${index}`,
            title: entry.Prestador,
            status: entry['Status Item'],
            amount: formatCurrency(entry['Valor Glosa Item']),
            sign: palette.sign,
            icon: palette.icon,
            variant: palette.variant,
            timestamp: referenceDates[index % referenceDates.length]
        };
    });
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
});

const formatCurrency = (value) => currencyFormatter.format(value ?? 0);

const formatCompact = (value) => {
    if (!value) return '0';
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k`;
    }
    return value.toString();
};

const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;
</script>

<template>
    <div class="gig-dashboard">
        <div class="gig-dashboard__hero">
            <div>
                <p class="gig-dashboard__label">Synvia GIG</p>
                <h1>Indicadores Financeiros</h1>
                <p>Monitoramento contínuo de glosas, liberações e variações por status e prestador.</p>
            </div>
            <img :src="synviaGigLogo" alt="Logo" class="gig-dashboard__logo" />
        </div>

        <div class="kpi-grid">
            <article v-for="card in kpiCards" :key="card.label" class="kpi-card" :class="`kpi-card--${card.intent}`">
                <div class="kpi-card__spark"></div>
                <div class="kpi-card__meta">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                </div>
                <small>{{ card.trend }}</small>
            </article>
        </div>

        <div class="panel-grid">
            <section class="panel panel--chart">
                <header>
                    <div>
                        <p class="panel__eyebrow">Receita Líquida</p>
                        <h2>{{ formatCurrency(receitaProjetada) }}</h2>
                        <span>previsto para o ciclo atual</span>
                    </div>
                    <div class="panel__actions">
                        <button class="panel__chip">2025</button>
                    </div>
                </header>
                <BaseChart :option="statusOption" height="360px" theme="dark" />
            </section>

            <aside class="panel panel--timeline">
                <header>
                    <div>
                        <p class="panel__eyebrow">Histórico recente</p>
                        <h3>Fluxo de eventos</h3>
                    </div>
                    <button class="panel__chip panel__chip--ghost">Ver tudo</button>
                </header>

                <ul class="timeline">
                    <li v-for="item in timelineItems" :key="item.id" :class="`timeline__item timeline__item--${item.variant}`">
                        <span class="timeline__icon"><i :class="item.icon"></i></span>
                        <div class="timeline__content">
                            <div class="timeline__title">
                                <strong>{{ item.title }}</strong>
                                <span>{{ item.timestamp }}</span>
                            </div>
                            <div class="timeline__status">{{ item.status }}</div>
                        </div>
                        <span class="timeline__amount">
                            <span>{{ item.sign }}</span>{{ item.amount }}
                        </span>
                    </li>
                </ul>
            </aside>
        </div>

        <section class="panel panel--heatmap">
            <header>
                <div>
                    <p class="panel__eyebrow">Glosas concentradas</p>
                    <h3>Prestadores x Status</h3>
                </div>
            </header>
            <BaseChart :option="prestadorHeatmapOption" height="420px" theme="dark" />
        </section>
    </div>
</template>

<style scoped>
.gig-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #0b0c0f;
  min-height: calc(100vh - 6rem);
  color: #f1f5f9;
}

.gig-dashboard__hero {
  background: #16181d;
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.gig-dashboard__hero h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.gig-dashboard__hero p {
  color: rgba(255, 255, 255, 0.7);
  max-width: 560px;
}

.gig-dashboard__logo {
  width: 200px;
  filter: drop-shadow(0 10px 20px rgba(15, 23, 42, 0.5));
}

.gig-dashboard__label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--primary-color);
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.kpi-card {
  position: relative;
  border-radius: 1rem;
  padding: 1.25rem;
  background: #181a1f;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
}

.kpi-card__spark {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(124, 232, 200, 0.25), transparent 55%);
  opacity: 0.8;
}

.kpi-card--success .kpi-card__spark {
  background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.35), transparent 55%);
}

.kpi-card--danger .kpi-card__spark {
  background: radial-gradient(circle at top right, rgba(248, 113, 113, 0.35), transparent 55%);
}

.kpi-card__meta {
  position: relative;
  z-index: 1;
}

.kpi-card__meta span {
  color: var(--primary-color);
  font-size: 0.85rem;
}

.kpi-card__meta strong {
  display: block;
  font-size: 1.8rem;
  margin-top: 0.25rem;
}

.kpi-card small {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.65);
}

.panel-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
}

.panel {
  background: #181a1f;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.45);
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--primary-color);
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.panel__actions {
  display: flex;
  gap: 0.5rem;
}

.panel__chip {
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
}

.panel__chip--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: none;
}

.panel--timeline {
  background: #181a1f;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.timeline__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.timeline__icon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: none;
}

.timeline__item--positive .timeline__icon {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.timeline__item--negative .timeline__icon {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.4);
  color: #f87171;
}

.timeline__item--warning .timeline__icon {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.timeline__content strong {
  display: block;
}

.timeline__content span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.timeline__status {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.timeline__amount {
  font-weight: 600;
}

.timeline__item--positive .timeline__amount {
  color: #34d399;
}

.timeline__item--negative .timeline__amount {
  color: #f87171;
}

.panel--heatmap {
  background: #181a1f;
}

.gig-dashboard h1,
.gig-dashboard h2,
.gig-dashboard h3 {
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .gig-dashboard {
    padding: 1rem;
  }

  .gig-dashboard__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
