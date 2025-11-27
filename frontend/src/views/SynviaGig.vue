<script setup>
import PageHero from '@/components/PageHero.vue';
import BaseChart from '@/components/charts/BaseChart.vue';
import dashboardData from '@/mock/data-dashboard.json';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const statusDataset = dashboardData.rankingStatusItem.data;
const prestadorDataset = dashboardData.rankingPrestadorStatusItem.data;
const operadoraDataset = dashboardData.rankingOperadora?.data ?? [];
const operadoraStatusDataset = dashboardData.rankingOperadoraStatus?.data ?? [];
const prestadorOperadoraStatusDataset = dashboardData.rankingPrestadorOperadoraStatus?.data ?? [];
const codAnsDataset = dashboardData.rankingCodAns?.data ?? [];
const codTabelaDataset = dashboardData.rankingCodTabela?.data ?? [];

const defaultLightChartTokens = {
    text: '#0f172a',
    subtle: '#475569',
    grid: 'rgba(15, 23, 42, 0.12)'
};

const defaultDarkChartTokens = {
    text: '#C7E6E7',
    subtle: '#8BCBCD',
    grid: 'rgba(139, 203, 205, 0.2)'
};

const chartColors = ref(defaultLightChartTokens);
const themeObserver = ref(null);

const computeChartColors = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return chartColors.value;
    }

    const isDark = detectDarkTheme();
    const defaults = isDark ? defaultDarkChartTokens : defaultLightChartTokens;
    const styles = getComputedStyle(document.documentElement);

    const text = (styles.getPropertyValue('--text-color') || '').trim() || defaults.text;
    const subtle = (styles.getPropertyValue('--text-color-secondary') || '').trim() || defaults.subtle;
    const border = (styles.getPropertyValue('--surface-border') || '').trim() || defaults.grid;

    const grid = applyAlpha(border, isDark ? 0.4 : 0.2);

    return {
        text,
        subtle,
        grid
    };
};

const detectDarkTheme = () => {
    if (typeof document === 'undefined') return false;
    const root = document.documentElement;
    const themeAttr = root.getAttribute('data-theme') ?? '';
    const classList = root.className ?? '';
    return /dark/i.test(themeAttr) || /dark/i.test(classList);
};

const applyAlpha = (rawColor, alpha) => {
    if (!rawColor) return `rgba(15, 23, 42, ${alpha})`;
    const color = rawColor.trim();

    if (color.startsWith('rgba')) {
        return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
            const [r, g, b] = inner
                .split(',')
                .slice(0, 3)
                .map((value) => value.trim());
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });
    }

    if (color.startsWith('rgb')) {
        return color.replace(/rgb\(([^)]+)\)/, (_, inner) => {
            const [r, g, b] = inner.split(',').map((value) => value.trim());
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });
    }

    if (!color.startsWith('#')) {
        return color;
    }

    let hex = color.replace('#', '');
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
    }

    if (hex.length !== 6) return color;

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

chartColors.value = computeChartColors();

onMounted(() => {
    chartColors.value = computeChartColors();
    if (typeof MutationObserver !== 'undefined') {
        themeObserver.value = new MutationObserver(() => {
            chartColors.value = computeChartColors();
        });

        themeObserver.value.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
    }
});

onBeforeUnmount(() => {
    themeObserver.value?.disconnect();
});

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

const buildSparklinePoints = (rawValues = []) => {
    const values = rawValues.map((value) => Number(value ?? 0));
    if (!values.length) {
        return '0,50 100,50';
    }

    if (values.length === 1) {
        return '0,50 100,50';
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values
        .map((value, index) => {
            const x = (index / (values.length - 1)) * 100;
            const normalized = (value - min) / range;
            const y = 100 - normalized * 100;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
};

const kpiCards = computed(() => {
    const glosaSpark = buildSparklinePoints(statusDataset.map((item) => item['Valor Glosa Item']));
    const liberadoSpark = buildSparklinePoints(statusDataset.map((item) => item['Valor Liberado Item']));
    const qtdSpark = buildSparklinePoints(statusDataset.map((item) => item.Qtd));
    const glosaPercent = glosaRate.value;
    const ticketMedioValue = ticketMedio.value;
    const qtdValue = totals.value.qtd;

    return [
        {
            label: 'Taxa de Glosa',
            value: formatPercent(glosaPercent),
            rawValue: glosaPercent,
            caption: 'vs mês anterior',
            delta: { value: '-2,1%', direction: 'down', raw: -0.021 },
            intent: 'danger',
            sparkline: glosaSpark
        },
        {
            label: 'Ticket médio liberado',
            value: formatCurrency(ticketMedioValue),
            rawValue: ticketMedioValue,
            caption: 'vs mês anterior',
            delta: { value: '+4,2%', direction: 'up', raw: 0.042 },
            intent: 'success',
            sparkline: liberadoSpark
        },
        {
            label: 'Itens processados',
            value: totals.value.qtd.toLocaleString('pt-BR'),
            rawValue: qtdValue,
            caption: '+1,6k novos itens',
            delta: { value: '-2,1%', direction: 'down', raw: -0.021, muted: true },
            intent: 'info',
            sparkline: qtdSpark
        }
    ];
});

const statusOption = computed(() => {
    const statuses = statusDataset.map((item) => item['Status Item']);

    return {
        textStyle: { color: chartColors.value.text },
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
            textStyle: { color: chartColors.value.subtle }
        },
        grid: { left: 48, right: 48, top: 80, bottom: 24, containLabel: true },
        xAxis: {
            type: 'category',
            data: statuses,
            axisLabel: { interval: 0, color: chartColors.value.subtle },
            axisLine: { lineStyle: { color: chartColors.value.grid } },
            axisTick: { show: false }
        },
        yAxis: [
            {
                type: 'value',
                axisLabel: {
                    color: chartColors.value.subtle,
                    formatter: (value) => formatCompact(value)
                },
                splitLine: { lineStyle: { color: chartColors.value.grid } }
            },
            {
                type: 'value',
                axisLabel: {
                    color: chartColors.value.subtle,
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
            const match = prestadorDataset.find((item) => item.Prestador === prestador && item['Status Item'] === status);
            const value = match ? match['Valor Glosa Item'] : 0;
            maxValue = Math.max(maxValue, value);
            matrix.push([colIndex, rowIndex, value]);
        });
    });

    return {
        textStyle: { color: chartColors.value.text },
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
            axisLabel: { rotate: 30, color: chartColors.value.subtle },
            splitArea: { show: true }
        },
        yAxis: {
            type: 'category',
            data: topPrestadores.value,
            axisLabel: { color: chartColors.value.text },
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
                    color: chartColors.value.text,
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

const operadoraTotals = computed(() =>
    operadoraDataset.reduce(
        (acc, item) => {
            acc.liberado += item['Valor Liberado Item'] ?? 0;
            acc.glosa += item['Valor Glosa Item'] ?? 0;
            acc.qtd += item.Qtd ?? 0;
            return acc;
        },
        { liberado: 0, glosa: 0, qtd: 0 }
    )
);

const operadoraOption = computed(() => {
    const categorias = operadoraDataset.map((item) => item.Operadora);
    const liberadoSerie = operadoraDataset.map((item) => item['Valor Liberado Item']);
    const glosaSerie = operadoraDataset.map((item) => item['Valor Glosa Item']);

    return {
        textStyle: { color: chartColors.value.text },
        color: ['#22d3ee', '#f87171'],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(5,31,33,0.95)',
            borderWidth: 0,
            formatter: (params = []) => {
                const index = params[0]?.dataIndex ?? 0;
                const row = operadoraDataset[index];
                if (!row) return '';
                const qtd = Number(row.Qtd ?? 0).toLocaleString('pt-BR');
                return [`<strong>${row.Operadora}</strong>`, `Qtd: ${qtd}`, `Valor Liberado: ${formatCurrency(row['Valor Liberado Item'])}`, `Valor Glosa: ${formatCurrency(row['Valor Glosa Item'])}`].join('<br/>');
            }
        },
        legend: {
            top: 16,
            textStyle: { color: chartColors.value.subtle }
        },
        grid: { left: 140, right: 32, top: 80, bottom: 32, containLabel: true },
        xAxis: {
            type: 'value',
            axisLabel: {
                color: chartColors.value.subtle,
                formatter: (value) => formatCompact(value)
            },
            splitLine: { lineStyle: { color: chartColors.value.grid } }
        },
        yAxis: {
            type: 'category',
            data: categorias,
            axisLabel: { color: chartColors.value.text }
        },
        series: [
            {
                name: 'Valor Liberado',
                type: 'bar',
                stack: 'valor',
                barWidth: 22,
                itemStyle: { borderRadius: [0, 6, 6, 0] },
                data: liberadoSerie
            },
            {
                name: 'Valor Glosa',
                type: 'bar',
                stack: 'valor',
                barWidth: 22,
                itemStyle: { borderRadius: [0, 6, 6, 0] },
                data: glosaSerie
            }
        ]
    };
});

const operadoraStatusOption = computed(() => {
    const operadoras = [...new Set(operadoraStatusDataset.map((item) => item.Operadora))];
    const statuses = [...new Set(operadoraStatusDataset.map((item) => item['Status Item']))];

    return {
        textStyle: { color: chartColors.value.text },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(5,31,33,0.95)',
            borderWidth: 0,
            valueFormatter: (value) => formatCurrency(value)
        },
        legend: {
            top: 12,
            textStyle: { color: chartColors.value.subtle }
        },
        grid: { left: 80, right: 24, top: 72, bottom: 24, containLabel: true },
        xAxis: {
            type: 'category',
            data: operadoras,
            axisLabel: { color: chartColors.value.subtle }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: chartColors.value.subtle,
                formatter: (value) => formatCompact(value)
            },
            splitLine: { lineStyle: { color: chartColors.value.grid } }
        },
        series: statuses.map((status) => ({
            name: status,
            type: 'bar',
            stack: 'operadora-status',
            barWidth: 18,
            emphasis: { focus: 'series' },
            data: operadoras.map((operadora) => {
                const match = operadoraStatusDataset.find((item) => item.Operadora === operadora && item['Status Item'] === status);
                return match ? match['Valor Glosa Item'] : 0;
            })
        }))
    };
});

const prestadorOperadoraTop = computed(() => {
    const aggregated = prestadorOperadoraStatusDataset.reduce((acc, item) => {
        const key = `${item.Prestador} · ${item.Operadora}`;
        if (!acc[key]) {
            acc[key] = {
                label: key,
                prestador: item.Prestador,
                operadora: item.Operadora,
                statuses: {},
                total: 0
            };
        }
        const status = item['Status Item'];
        acc[key].statuses[status] = (acc[key].statuses[status] ?? 0) + item['Valor Glosa Item'];
        acc[key].total += item['Valor Glosa Item'];
        return acc;
    }, {});

    return Object.values(aggregated)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
});

const prestadorOperadoraOption = computed(() => {
    const combos = prestadorOperadoraTop.value;
    const statuses = [...new Set(combos.flatMap((combo) => Object.keys(combo.statuses)))];
    const categories = combos.map((combo) => combo.label);

    return {
        textStyle: { color: chartColors.value.text },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(5,31,33,0.95)',
            borderWidth: 0,
            formatter: (params = []) => {
                if (!params.length) return '';
                const combo = combos[params[0].dataIndex];
                return [`<strong>${combo.prestador}</strong>`, combo.operadora, ...params.filter((p) => p.value).map((p) => `${p.seriesName}: ${formatCurrency(p.value)}`)].join('<br/>');
            }
        },
        legend: {
            top: 12,
            textStyle: { color: chartColors.value.subtle }
        },
        grid: { left: 190, right: 24, top: 72, bottom: 24 },
        xAxis: {
            type: 'value',
            axisLabel: {
                color: chartColors.value.subtle,
                formatter: (value) => formatCompact(value)
            },
            splitLine: { lineStyle: { color: chartColors.value.grid } }
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                color: chartColors.value.text,
                formatter: (value) => (value.length > 32 ? `${value.slice(0, 32)}…` : value)
            }
        },
        series: statuses.map((status) => ({
            name: status,
            type: 'bar',
            stack: 'prestador-operadora',
            barWidth: 18,
            emphasis: { focus: 'series' },
            data: combos.map((combo) => combo.statuses[status] ?? 0)
        }))
    };
});

const codAnsTop = computed(() => codAnsDataset.slice(0, 15));

const codAnsOption = computed(() => {
    const categorias = codAnsTop.value.map((item) => item['Glosa Item - Cód. ANS'] ?? 'Não informado');
    const quantidades = codAnsTop.value.map((item) => item.Qtd ?? 0);

    return {
        textStyle: { color: chartColors.value.text },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(5,31,33,0.95)',
            borderWidth: 0,
            formatter: (params = []) => {
                const idx = params[0]?.dataIndex ?? 0;
                const row = codAnsTop.value[idx];
                if (!row) return '';
                return [`<strong>Cód. ANS ${row['Glosa Item - Cód. ANS'] ?? 'N/A'}</strong>`, `Qtd: ${row.Qtd.toLocaleString('pt-BR')}`, `Participação: ${row.Percentual}`].join('<br/>');
            }
        },
        grid: { left: 150, right: 24, top: 32, bottom: 24 },
        xAxis: {
            type: 'value',
            axisLabel: { color: chartColors.value.subtle },
            splitLine: { lineStyle: { color: chartColors.value.grid } }
        },
        yAxis: {
            type: 'category',
            data: categorias,
            axisLabel: { color: chartColors.value.text }
        },
        series: [
            {
                name: 'Quantidade',
                type: 'bar',
                barWidth: 16,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: '#34d399'
                },
                data: quantidades
            }
        ]
    };
});

const codTabelaOption = computed(() => {
    const categorias = codTabelaDataset.map((item) => item['Cód. Tabela'] ?? 'N/A');
    const liberadoSerie = codTabelaDataset.map((item) => item['Valor Liberado Item'] ?? 0);
    const glosaSerie = codTabelaDataset.map((item) => item['Valor Glosa Item'] ?? 0);
    const qtdSerie = codTabelaDataset.map((item) => item.Qtd ?? 0);

    return {
        textStyle: { color: chartColors.value.text },
        color: ['#34d399', '#f87171', '#60a5fa'],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(5,31,33,0.95)',
            borderWidth: 0,
            formatter: (params = []) => {
                const idx = params[0]?.dataIndex ?? 0;
                const row = codTabelaDataset[idx];
                if (!row) return '';
                return [`<strong>Tabela ${row['Cód. Tabela'] ?? 'N/A'}</strong>`, `Qtd: ${row.Qtd.toLocaleString('pt-BR')}`, `Liberado: ${formatCurrency(row['Valor Liberado Item'])}`, `Glosa: ${formatCurrency(row['Valor Glosa Item'])}`].join(
                    '<br/>'
                );
            }
        },
        legend: {
            top: 12,
            textStyle: { color: chartColors.value.subtle }
        },
        grid: { left: 80, right: 32, top: 72, bottom: 32, containLabel: true },
        xAxis: {
            type: 'category',
            data: categorias,
            axisLabel: { color: chartColors.value.subtle }
        },
        yAxis: [
            {
                type: 'value',
                axisLabel: {
                    color: chartColors.value.subtle,
                    formatter: (value) => formatCompact(value)
                },
                splitLine: { lineStyle: { color: chartColors.value.grid } }
            },
            {
                type: 'value',
                axisLabel: { color: chartColors.value.subtle },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'Valor Liberado',
                type: 'bar',
                stack: 'valor-tabela',
                barWidth: 20,
                data: liberadoSerie
            },
            {
                name: 'Valor Glosa',
                type: 'bar',
                stack: 'valor-tabela',
                barWidth: 20,
                data: glosaSerie
            },
            {
                name: 'Quantidade',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbolSize: 6,
                data: qtdSerie
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

const referenceDates = ['13 Jun 2025 · 11:09', '13 Jun 2025 · 08:22', '12 Jun 2025 · 14:56', '12 Jun 2025 · 06:11', '11 Jun 2025 · 03:50', '10 Jun 2025 · 21:54', '09 Jun 2025 · 18:40', '08 Jun 2025 · 09:24'];

const timelineItems = computed(() => {
    const sorted = [...prestadorDataset].sort((a, b) => b['Valor Glosa Item'] - a['Valor Glosa Item']);

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
        <PageHero title="Indicadores Financeiros" subtitle="Monitoramento contínuo de glosas, liberações e variações por status e prestador." />

        <div class="kpi-grid">
            <article v-for="card in kpiCards" :key="card.label" class="kpi-card" :class="`kpi-card--${card.intent}`">
                <div class="kpi-card__background"></div>
                <div class="kpi-card__header">
                    <span class="kpi-card__label">{{ card.label }}</span>
                    <span class="kpi-card__delta" :class="[`kpi-card__delta--${card.delta.direction}`, { 'kpi-card__delta--muted': card.delta.muted }]">
                        <i :class="card.delta.direction === 'up' ? 'pi pi-arrow-up-right' : card.delta.direction === 'down' ? 'pi pi-arrow-down-right' : 'pi pi-minus'"></i>
                        {{ card.delta.value }}
                    </span>
                </div>
                <div class="kpi-card__value" :class="{ 'text-negative': card.rawValue < 0 }">{{ card.value }}</div>
                <div class="kpi-card__footer">
                    <small>{{ card.caption }}</small>
                </div>
                <svg class="kpi-card__sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline :points="card.sparkline" />
                </svg>
            </article>
        </div>

        <div class="panel-grid">
            <section class="panel panel--chart">
                <header>
                    <div>
                        <p class="panel__eyebrow">Receita Líquida</p>
                        <h2 :class="{ 'text-negative': receitaProjetada < 0 }">{{ formatCurrency(receitaProjetada) }}</h2>
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
                            <span>{{ item.sign }}</span
                            >{{ item.amount }}
                        </span>
                    </li>
                </ul>
            </aside>
        </div>

        <section v-if="operadoraDataset.length" class="panel panel--operators">
            <header>
                <div>
                    <p class="panel__eyebrow">Operadoras</p>
                    <h3>{{ dashboardData.rankingOperadora.title }}</h3>
                    <p class="panel__subtitle">{{ formatCurrency(operadoraTotals.liberado) }} liberado · {{ formatCurrency(operadoraTotals.glosa) }} em glosa</p>
                </div>
                <div class="panel__actions">
                    <button class="panel__chip">{{ operadoraDataset.length }} operadoras</button>
                </div>
            </header>
            <BaseChart :option="operadoraOption" height="320px" theme="dark" />
        </section>

        <section class="panel panel--heatmap">
            <header>
                <div>
                    <p class="panel__eyebrow">Glosas concentradas</p>
                    <h3>Prestadores x Status</h3>
                </div>
            </header>
            <BaseChart :option="prestadorHeatmapOption" height="420px" theme="dark" />
        </section>

        <div v-if="operadoraStatusDataset.length || codAnsDataset.length" class="panel-grid panel-grid--equal">
            <section v-if="operadoraStatusDataset.length" class="panel">
                <header>
                    <div>
                        <p class="panel__eyebrow">Operadora x Status</p>
                        <h3>{{ dashboardData.rankingOperadoraStatus.title }}</h3>
                        <p class="panel__subtitle">Distribuição do valor glosado por operadora e status</p>
                    </div>
                </header>
                <BaseChart :option="operadoraStatusOption" height="360px" theme="dark" />
            </section>

            <section v-if="codAnsDataset.length" class="panel">
                <header>
                    <div>
                        <p class="panel__eyebrow">Códigos ANS</p>
                        <h3>{{ dashboardData.rankingCodAns.title }}</h3>
                        <p class="panel__subtitle">Top 15 códigos por ocorrência em glosas</p>
                    </div>
                </header>
                <BaseChart :option="codAnsOption" height="360px" theme="dark" />
            </section>
        </div>

        <div v-if="prestadorOperadoraStatusDataset.length || codTabelaDataset.length" class="panel-grid panel-grid--equal">
            <section v-if="prestadorOperadoraStatusDataset.length" class="panel">
                <header>
                    <div>
                        <p class="panel__eyebrow">Prestador · Operadora</p>
                        <h3>{{ dashboardData.rankingPrestadorOperadoraStatus.title }}</h3>
                        <p class="panel__subtitle">Maiores combinações por valor de glosa</p>
                    </div>
                </header>
                <BaseChart :option="prestadorOperadoraOption" height="420px" theme="dark" />
            </section>

            <section v-if="codTabelaDataset.length" class="panel">
                <header>
                    <div>
                        <p class="panel__eyebrow">Códigos de Tabela</p>
                        <h3>{{ dashboardData.rankingCodTabela.title }}</h3>
                        <p class="panel__subtitle">Comparativo de valor liberado, glosa e quantidade</p>
                    </div>
                </header>
                <BaseChart :option="codTabelaOption" height="360px" theme="dark" />
            </section>
        </div>
    </div>
</template>

<style scoped>
.gig-dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--surface-ground);
    min-height: calc(100vh - 6rem);
    color: var(--text-color);
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.kpi-card {
    position: relative;
    border-radius: 1rem;
    padding: 1.5rem;
    background: var(--surface-overlay);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow: hidden;
    min-height: 160px;
    border: 1px solid var(--surface-border);
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
    color: var(--text-color);
}

.kpi-card__background {
    position: absolute;
    inset: 0;
    opacity: 0.35;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.25), transparent 55%);
}

.kpi-card--success .kpi-card__background {
    background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.5), transparent 55%);
}

.kpi-card--danger .kpi-card__background {
    background: radial-gradient(circle at top right, rgba(248, 113, 113, 0.5), transparent 55%);
}

.kpi-card--info .kpi-card__background {
    background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.45), transparent 55%);
}

.kpi-card__header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.kpi-card__label {
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-color-secondary);
}

.kpi-card__delta {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    border: 1px solid transparent;
}

.kpi-card__delta i {
    font-size: 0.85rem;
}

.kpi-card__delta--up {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.35));
    color: #22c55e;
    border-color: rgba(16, 185, 129, 0.4);
}

.kpi-card__delta--down {
    background: linear-gradient(135deg, rgba(248, 113, 113, 0.18), rgba(248, 113, 113, 0.38));
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.55);
}

.kpi-card--info .kpi-card__delta--down {
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0.35));
    color: #0ea5e9;
    border-color: rgba(14, 165, 233, 0.5);
}

.kpi-card__delta--muted {
    background: linear-gradient(135deg, #22d3ee, #67e8f9);
    color: #042f2e;
}

.kpi-card__delta--flat {
    background: linear-gradient(135deg, #94a3b8, #cbd5f5);
    color: #0f172a;
}

.kpi-card__value {
    position: relative;
    z-index: 1;
    font-size: 2.25rem;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--text-color);
}

.kpi-card__footer {
    position: relative;
    z-index: 1;
}

.kpi-card__footer small {
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

.kpi-card__sparkline {
    position: absolute;
    inset: auto 0 0;
    height: 70px;
    width: 100%;
    z-index: 0;
    fill: none;
    stroke: rgba(248, 250, 252, 0.65);
    stroke-width: 2;
    opacity: 0.45;
    pointer-events: none;
}

.text-negative {
    color: #f87171 !important;
}

.kpi-card--success .kpi-card__sparkline {
    stroke: rgba(16, 185, 129, 0.8);
}

.kpi-card--danger .kpi-card__sparkline {
    stroke: rgba(248, 113, 113, 0.85);
}

.kpi-card--info .kpi-card__sparkline {
    stroke: rgba(59, 130, 246, 0.8);
}

.panel-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1.5rem;
}

.panel-grid--equal {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.panel {
    background: var(--surface-card);
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.panel header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel__subtitle {
    margin: 0.35rem 0 0;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.panel__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text-color);
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
}

.panel__actions {
    display: flex;
    gap: 0.5rem;
}

.panel__chip {
    border: 1px solid var(--surface-border);
    background: var(--surface-hover);
    color: var(--text-color);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.85rem;
}

.panel__chip--ghost {
    background: transparent;
    color: var(--text-color-secondary);
    border: none;
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
    background: var(--surface-hover);
    border: 1px solid var(--surface-border);
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
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

.timeline__status {
    color: var(--text-color-secondary);
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
