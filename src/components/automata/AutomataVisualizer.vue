<template>
  <div class="box automata-container">
    <!-- 类型切换选项卡 -->
    <div class="tabs is-small mb-0">
      <ul>
        <li :class="{ 'is-active': automataType === 'NFA' }">
          <a @click="setAutomataType('NFA')">NFA</a>
        </li>
        <li :class="{ 'is-active': automataType === 'DFA' }">
          <a @click="setAutomataType('DFA')">DFA</a>
        </li>
      </ul>
    </div>

    <!-- 图表容器 -->
    <div class="chart-wrapper">
      <AutomataChart :automata="currentAutomata" :current-states="currentState?.currentStates || []"
        :is-simulating="isSimulating" :title="`${automataType}自动机`" />
    </div>

    <!-- 显示当前正则表达式和控制组件 -->
    <div class="controls-wrapper">
      <div v-if="hasAutomata" class="regex-display has-text-centered">
        <span class="tag is-info">正则表达式: {{ store.regex || '空' }}</span>
      </div>

      <!-- 模拟控制组件 -->
      <SimulationControls v-if="isSimulating && steps.length > 0" :current-state="currentState" :steps="steps"
        :current-step="currentStep" :is-accepted="isAccepted" :has-prev-step="hasPrevStep" :has-next-step="hasNextStep"
        @prev="prevStep" @next="nextStep" @reset="resetSimulation" @play-pause="togglePlayback" />

      <!-- 无自动机时的提示 -->
      <div class="notification is-info is-light py-2 px-3" v-if="!hasAutomata">
        <p>输入正则表达式并点击生成按钮查看自动机图,节点自身带有标签表示自环</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAutomataStore } from '../../stores/automataStore';
import AutomataChart from './AutomataChart.vue';
import SimulationControls from './SimulationControls.vue';

const store = useAutomataStore();

// 计算属性
const automataType = computed(() => store.automataType);
const hasAutomata = computed(() =>
  store.automata &&
  store.automata.states &&
  store.automata.states.length > 0
);
const currentAutomata = computed(() => {
  if (!store.automata) return null;
  return automataType.value === 'NFA' ? store.automata.nfa : store.automata.dfa;
});

// 模拟相关计算属性
const isSimulating = computed(() => store.isSimulating);
const steps = computed(() => store.steps);
const currentStep = computed(() => store.currentStep);
const currentState = computed(() => store.currentState);
const isAccepted = computed(() => store.isAccepted);
const hasPrevStep = computed(() => store.hasPrevStep);
const hasNextStep = computed(() => store.hasNextStep);

// 方法
function setAutomataType(type: string) {
  store.setAutomataType(type);
}

function prevStep() {
  store.prevStep();
}

function nextStep() {
  store.nextStep();
}

function resetSimulation() {
  store.resetSimulation();
}

function togglePlayback(isPlaying: boolean) {
  // 播放/暂停控制逻辑，可以在这里添加额外的状态管理
  console.log('播放状态:', isPlaying);
}
</script>

<style scoped>
.automata-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  /* 动态计算高度，减去头部和其他组件的高度 */
  min-height: 600px;
  position: relative;
  padding: 0.75rem;
}

/* 减小tabs的边距 */
.tabs.is-small {
  margin-bottom: 0;
}

.chart-wrapper {
  flex-grow: 1;
  min-height: 500px;
  /* 增加最小高度 */
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
  /* 保证图表不会溢出 */
}

.controls-wrapper {
  flex-shrink: 0;
}

.regex-display {
  margin: 0.25rem 0;
}

/* 减小通知的内边距 */
.notification.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.notification.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
</style>
