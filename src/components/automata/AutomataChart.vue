<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import echarts from '../../utils/echartsUtil';
import { createAutomataGraphOption } from '../../utils/echartsUtil';

const props = defineProps({
  automata: {
    type: Object,
    required: true
  },
  currentStates: {
    type: Array,
    default: () => []
  },
  isSimulating: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '自动机'
  }
});

const chartContainer = ref(null);
const chart = ref(null);

// 转换自动机数据为ECharts格式
function formatAutomataData() {
  if (!props.automata || !props.automata.states) return { nodes: [], edges: [] };

  // 创建节点
  const nodes = props.automata.states.map(state => {
    // 检查状态是否为当前活动状态
    const isActive = props.currentStates.includes(state.id);

    return {
      id: state.id,
      name: state.name,
      symbolSize: state.isAccepting ? 70 : 60,
      isStart: state.isStart,
      isAccepting: state.isAccepting,
      // 节点样式
      itemStyle: {
        color: state.isAccepting ? '#91cc75' : '#5470c6',
        borderWidth: isActive ? 5 : (state.isStart ? 4 : 1),
        borderColor: isActive ? '#ff9900' : (state.isStart ? '#ff0000' : '#999'),
        shadowBlur: isActive ? 20 : 0,
        shadowColor: isActive ? '#ffcc00' : ''
      },
      label: {
        show: true,
        position: 'inside',
        formatter: state.name + (state.isAccepting ? '(接受)' : ''),
        color: '#fff',
        fontWeight: 'bold'
      }
    };
  });

  // 准备边数据
  const edgesMap = new Map();

  props.automata.transitions.forEach(transition => {
    const key = `${transition.from}-${transition.to}`;
    const symbol = transition.symbol;

    if (edgesMap.has(key)) {
      const existingEdge = edgesMap.get(key);
      if (!existingEdge.symbol.includes(symbol)) {
        existingEdge.symbol += `, ${symbol}`;
      }
    } else {
      // 计算曲率 - 自环需要较大曲率
      const isSelfLoop = transition.from === transition.to;
      const curveness = isSelfLoop ? 0.7 : 0.2;

      edgesMap.set(key, {
        source: transition.from,
        target: transition.to,
        symbol: symbol,
        // 边的样式
        lineStyle: {
          curveness: curveness,
          type: symbol === 'ε' ? 'dashed' : 'solid'
        }
      });
    }
  });

  // 为每个边设置唯一的曲率，避免重叠
  const fromToCount = new Map();
  edgesMap.forEach((edge, key) => {
    const [from, to] = key.split('-');
    const fromToKey = `${from}-${to}`;
    const count = fromToCount.get(fromToKey) || 0;
    fromToCount.set(fromToKey, count + 1);

    if (from !== to && count > 0) {
      // 为多条边分配不同曲率
      edge.lineStyle.curveness = 0.2 + (count * 0.1);
    }
  });

  // 转换为数组
  const edges = Array.from(edgesMap.values()).map(edge => ({
    source: edge.source,
    target: edge.target,
    symbol: edge.symbol,
    lineStyle: edge.lineStyle,
    label: {
      show: true,
      formatter: edge.symbol,
      fontSize: 14,
      backgroundColor: '#fff',
      padding: [2, 4],
      borderRadius: 4
    }
  }));

  return { nodes, edges };
}

// 初始化/更新图表
function renderChart() {
  if (!chartContainer.value || !props.automata) return;

  const { nodes, edges } = formatAutomataData();

  if (nodes.length === 0) return;

  if (!chart.value) {
    chart.value = echarts.init(chartContainer.value);
  }

  // 创建图表配置
  const option = createAutomataGraphOption(nodes, edges, props.title);
  chart.value.setOption(option, true);
}

// 高亮当前状态
function highlightCurrentStates() {
  if (!chart.value || !props.automata) return;

  const { nodes } = formatAutomataData();

  chart.value.setOption({
    series: [{
      data: nodes
    }]
  });
}

// 监听数据变化
watch([() => props.automata, () => props.currentStates, () => props.title], () => {
  renderChart();
}, { deep: true });

// 处理窗口调整
function handleResize() {
  chart.value?.resize();
}

onMounted(() => {
  renderChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (chart.value) {
    chart.value.dispose();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
}
</style>
