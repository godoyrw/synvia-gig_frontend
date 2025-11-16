<template>
  <VChart
    class="base-chart"
    :option="mergedOption"
    :theme="theme"
    :autoresize="autoresize"
    :style="chartStyle"
    v-bind="attrs"
  />
</template>

<script setup>
import { BarChart, HeatmapChart, LineChart, PieChart, TreemapChart } from 'echarts/charts';
import {
    DatasetComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { computed, useAttrs } from 'vue';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  TreemapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  VisualMapComponent
]);

const props = defineProps({
  option: {
    type: Object,
    default: () => ({})
  },
  autoresize: {
    type: Boolean,
    default: true
  },
  theme: {
    type: [String, Object],
    default: 'light'
  },
  height: {
    type: String,
    default: '360px'
  },
  width: {
    type: String,
    default: '100%'
  }
});

const baseOption = Object.freeze({
  animationDuration: 500,
  textStyle: {
    fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
    color: '#475569'
  },
  grid: {
    left: 32,
    right: 32,
    top: 48,
    bottom: 24,
    containLabel: true
  },
  legend: {
    top: 8,
    itemGap: 16,
    textStyle: {
      color: '#475569',
      fontSize: 12
    }
  },
  tooltip: {
    trigger: 'item',
    borderWidth: 0,
    backgroundColor: 'rgba(15,23,42,0.92)',
    textStyle: { color: '#f8fafc', fontSize: 12 },
    padding: 12
  }
});

const attrs = useAttrs();

const chartStyle = computed(() => ({
  height: props.height,
  width: props.width
}));

const mergedOption = computed(() => deepMerge(baseOption, props.option ?? {}));

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function cloneTarget(value) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (isObject(value)) {
    return { ...value };
  }

  return {};
}

function deepMerge(target, source) {
  const result = cloneTarget(target);

  if (Array.isArray(source)) {
    return [...source];
  }

  if (!isObject(source)) {
    return source ?? result;
  }

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue)) {
      result[key] = deepMerge(isObject(targetValue) ? targetValue : {}, sourceValue);
    } else if (Array.isArray(sourceValue)) {
      result[key] = [...sourceValue];
    } else {
      result[key] = sourceValue;
    }
  });

  return result;
}
</script>

<style scoped>
.base-chart {
  width: 100%;
  min-height: 200px;
}
</style>