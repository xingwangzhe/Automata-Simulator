<template>
  <div class="box automata-container">
    <div class="tabs">
      <ul>
        <li :class="{ 'is-active': automataType === 'NFA' }">
          <a @click="setAutomataType('NFA')">NFA</a>
        </li>
        <li :class="{ 'is-active': automataType === 'DFA' }">
          <a @click="setAutomataType('DFA')">DFA</a>
        </li>
      </ul>
    </div>
    <div class="chart-container" ref="chartContainer"></div>

    <!-- 显示当前正则表达式 -->
    <div v-if="hasAutomata" class="regex-display mt-2 has-text-centered">
      <span class="tag is-info is-medium">正则表达式: {{ store.regex || '空' }}</span>
    </div>

    <!-- 添加模拟控制和状态展示 -->
    <div v-if="isSimulating && steps.length > 0" class="simulation-controls mt-3">
      <div class="notification is-light"
        :class="{ 'is-success': isAccepted, 'is-danger': !isAccepted && steps.length > 1 }">
        <p>当前状态: <strong>{{ currentState?.state || '无状态' }}</strong>
          (位置: {{ currentState?.position >= 0 ? currentState?.position + 1 : '开始' }},
          字符: {{ currentState?.character || '无' }})</p>
        <p v-if="currentStep === steps.length - 1">
          <strong>结果: {{ isAccepted ? '接受' : '拒绝' }}</strong>
        </p>
      </div>

      <div class="buttons is-centered">
        <button class="button is-info" @click="resetSimulation">重置</button>
        <button class="button" @click="prevStep" :disabled="!hasPrevStep">
          <span class="icon"><i class="fas fa-step-backward"></i></span>
          <span>上一步</span>
        </button>
        <button class="button" @click="nextStep" :disabled="!hasNextStep">
          <span>下一步</span>
          <span class="icon"><i class="fas fa-step-forward"></i></span>
        </button>
      </div>
    </div>

    <div class="notification is-info" v-if="!hasAutomata">
      <p>输入正则表达式并点击生成按钮查看自动机图,节点自身带有标签表示自环</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useAutomataStore } from '../stores/automataStore';
import * as echarts from 'echarts';
import { State, Transition } from '../utils/automataConverter';

// 定义接口以解决类型问题
interface AutomataState extends State {
  id: string;
  name: string;
  isStart: boolean;
  isAccepting: boolean;
}

interface AutomataTransition extends Transition {
  from: string;
  to: string;
  symbol: string;
}

interface Automata {
  states: AutomataState[];
  transitions: AutomataTransition[];
}

const store = useAutomataStore();
const chartContainer = ref<HTMLElement | null>(null);
const chart = ref<echarts.ECharts | null>(null);
const automataType = computed(() => store.automataType);
const hasAutomata = computed(() =>
  store.automata &&
  store.automata.states &&
  store.automata.states.length > 0
);

// 添加模拟相关的计算属性
const isSimulating = computed(() => store.isSimulating);
const steps = computed(() => store.steps);
const currentStep = computed(() => store.currentStep);
const currentState = computed(() => store.currentState);
const isAccepted = computed(() => store.isAccepted);
const hasPrevStep = computed(() => store.hasPrevStep);
const hasNextStep = computed(() => store.hasNextStep);

function setAutomataType(type: string) {
  store.setAutomataType(type);
}

// 添加模拟控制方法
function prevStep() {
  store.prevStep();
  highlightCurrentStates();
}

function nextStep() {
  store.nextStep();
  highlightCurrentStates();
}

function resetSimulation() {
  store.resetSimulation();
  renderChart(); // 重绘图表
}

// 高亮当前活动状态
function highlightCurrentStates() {
  if (!chart.value || !currentState.value || !currentState.value.currentStates) return;

  const automata = automataType.value === 'NFA' ? store.automata.nfa : store.automata.dfa;
  if (!automata) return;

  // 准备节点样式数据
  const nodeData = (automata.states as AutomataState[]).map(state => {
    // 检查状态是否为当前活动状态
    const isActive = currentState.value.currentStates.includes(state.id);

    return {
      id: state.id,
      // 高亮当前状态
      itemStyle: {
        color: state.isAccepting ? '#91cc75' : '#5470c6',
        borderWidth: isActive ? 5 : (state.isStart ? 4 : 1),
        borderColor: isActive ? '#ff9900' : (state.isStart ? '#ff0000' : '#999'),
        shadowBlur: isActive ? 20 : 0,
        shadowColor: isActive ? '#ffcc00' : ''
      }
    };
  });

  // 更新图表
  chart.value.setOption({
    series: [{
      data: nodeData,
    }]
  });
}

function renderChart() {
  if (!chartContainer.value || !hasAutomata.value) return;

  if (!chart.value) {
    chart.value = echarts.init(chartContainer.value);
  }

  // 从store获取自动机数据
  const automata = automataType.value === 'NFA' ? store.automata.nfa : store.automata.dfa;
  if (!automata) return;

  // 使用类型断言确保类型安全
  const typedAutomata = automata as unknown as Automata;

  // 准备ECharts数据
  const nodes = typedAutomata.states.map((state) => ({
    id: state.id,
    name: state.name,
    symbolSize: state.isAccepting ? 70 : 60,
    symbol: state.isAccepting ? 'circle' : 'circle',
    itemStyle: {
      color: state.isAccepting ? '#91cc75' : '#5470c6',
      borderWidth: state.isStart ? 4 : 1,
      borderColor: state.isStart ? '#ff0000' : '#999'
    },
    label: {
      show: true,
      // 修改这里，使用ECharts支持的位置值
      position: 'inside' as const, // 使用类型断言确保类型匹配
      formatter: state.name + (state.isAccepting ? '(接受)' : ''),
      color: '#fff',
      fontWeight: 'bold'
    }
  }));

  // 改进边的展示，处理自环和多重转换
  const edgesMap = new Map();

  typedAutomata.transitions.forEach((transition) => {
    const key = `${transition.from}-${transition.to}`;
    if (edgesMap.has(key)) {
      // 对于已存在的边，合并符号标签
      const existingEdge = edgesMap.get(key);
      existingEdge.symbol += `,${transition.symbol}`;
    } else {
      // 创建新的边
      edgesMap.set(key, {
        source: transition.from,
        target: transition.to,
        symbol: transition.symbol,
        // 如果是自环，增加弯曲度
        lineStyle: {
          width: 2,
          curveness: transition.from === transition.to ? 0.6 : 0.2,
          type: transition.symbol === 'ε' ? 'dashed' : 'solid'
        }
      });
    }
  });

  const edges = Array.from(edgesMap.values()).map(edge => ({
    source: edge.source,
    target: edge.target,
    label: {
      show: true,
      formatter: edge.symbol,
      fontSize: 14,
      backgroundColor: '#fff',
      padding: [2, 4],
      borderRadius: 4
    },
    lineStyle: edge.lineStyle
  }));

  // 使用any类型避免ECharts类型错误
  const option: any = {
    title: {
      text: `${automataType.value}自动机`,
      top: 'top',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      formatter: function (params: any) {
        if (params.dataType === 'node') {
          const state = typedAutomata.states.find((s) => s.id === params.data.id);
          return `状态: ${state?.name || ''}<br/>开始状态: ${state?.isStart ? '是' : '否'}<br/>接受状态: ${state?.isAccepting ? '是' : '否'}`;
        } else if (params.dataType === 'edge') {
          return `转换: ${params.data.label.formatter}`;
        }
        return '';
      }
    },
    animationDurationUpdate: 1000,
    animationEasingUpdate: 'quinticOut' as const,
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        edges: edges,
        force: {
          repulsion: 800,
          edgeLength: 200,
          gravity: 0.1,
          layoutAnimation: true
        },
        roam: true,
        label: {
          position: 'inside' as const
        },
        lineStyle: {
          color: '#999',
          curveness: 0.3,
          width: 2
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        autoCurveness: [0.2, 0.4, 0.6]
      }
    ]
  };

  chart.value.setOption(option);

  // 如果当前正在模拟，高亮当前状态
  if (isSimulating.value && currentState.value) {
    highlightCurrentStates();
  }

  setTimeout(() => {
    chart.value?.resize();
  }, 0);
}

// 窗口大小变化时重绘
window.addEventListener('resize', () => {
  chart.value?.resize();
});

onMounted(() => {
  renderChart();
});

// 监听自动机数据变化和模拟步骤变化
watch([
  () => store.automata,
  () => store.automataType,
  () => store.currentStep
], () => {
  renderChart();
}, { deep: true });
</script>

<style scoped>
.automata-container {
  display: flex;
  flex-direction: column;
  height: 520px;
}

.chart-container {
  flex-grow: 1;
  min-height: 350px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
}

.simulation-controls {
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid #eee;
}

.regex-display {
  margin: 0.5rem 0;
}
</style>
