<template>
  <div class="box automata-container">
    <div class="tabs is-boxed">
      <ul>
        <li :class="{ 'is-active': automataType === 'NFA' }">
          <a @click="setAutomataType('NFA')">NFA</a>
        </li>
        <li :class="{ 'is-active': automataType === 'DFA' }">
          <a @click="setAutomataType('DFA')">DFA</a>
        </li>
      </ul>
    </div>
    <div class="chart-wrapper">
      <AutomataChart :key="chartKey" :automata="currentAutomata" :current-states="currentState?.currentStates || []"
        :is-simulating="isSimulating" :title="`${automataType}自动机`" />
    </div>

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
      <p>输入正则表达式并点击生成按钮查看自动机图</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { useAutomataStore } from '../stores/automataStore';
import AutomataChart from './automata/AutomataChart.vue';
import { debugAutomata } from '../utils/debugTools';

const store = useAutomataStore();
const automataType = computed(() => store.automataType);
const hasAutomata = computed(() =>
  store.automata &&
  store.automata.states &&
  store.automata.states.length > 0
);

// 添加chart key以强制重新渲染
const chartKey = ref(0);

// 获取当前使用的自动机数据
const currentAutomata = computed(() => {
  if (!store.automata) return null;
  const automata = automataType.value === 'NFA' ? store.automata.nfa : store.automata.dfa;

  // 调试输出当前自动机
  if (automata) {
    console.log(`当前自动机类型: ${automataType.value}`);
  }

  return automata;
});

function setAutomataType(type: string) {
  if (type === automataType.value) return; // 避免不必要的重新渲染

  store.setAutomataType(type);

  // 强制图表重新渲染
  chartKey.value++;

  // 当切换自动机类型时，确保高亮状态保持一致，并优化节点布局
  console.log(`切换到${type}，重新布局节点`);
}

// 调试观察自动机变化
watch(() => store.automata, (newValue) => {
  if (newValue) {
    console.log("自动机已更新");
    debugAutomata(currentAutomata.value);
  }
}, { deep: true });

onMounted(() => {
  // 如果已有自动机数据，调试输出
  if (store.automata) {
    debugAutomata(currentAutomata.value);
  }
});

// 添加模拟相关的计算属性
const isSimulating = computed(() => store.isSimulating);
const steps = computed(() => store.steps);
const currentStep = computed(() => store.currentStep);
const currentState = computed(() => store.currentState);
const isAccepted = computed(() => store.isAccepted);
const hasPrevStep = computed(() => store.hasPrevStep);
const hasNextStep = computed(() => store.hasNextStep);

// 监听自动机类型变化，确保当前活动状态正确高亮
watch(automataType, () => {
  // 强制图表重新渲染
  chartKey.value++;
});
function prevStep() {
  store.prevStep();
}

function nextStep() {
  store.nextStep();
}

function resetSimulation() {
  store.resetSimulation();
}
</script>

<style scoped>
.automata-container {
  display: flex;
  flex-direction: column;
  height: 520px;
  position: relative;
  /* 确保容器是相对定位的 */
}

.tabs {
  margin-bottom: 0.5rem;
  position: relative;
  /* 确保选项卡正确定位 */
  z-index: 10;
  /* 提高z-index确保不被其他元素覆盖 */
}

.tabs ul {
  padding-left: 0;
  /* 确保没有额外的填充 */
}

.chart-wrapper {
  flex-grow: 1;
  min-height: 350px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
  /* 确保图表在标签页之下 */
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
