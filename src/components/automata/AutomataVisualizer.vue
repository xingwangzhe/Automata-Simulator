<template>
  <div class="box automata-container">
    <!-- 类型切换选项卡 -->
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

    <!-- 图表容器 -->
    <div class="chart-wrapper">
      <AutomataChart :automata="currentAutomata" :current-states="currentState?.currentStates || []"
        :is-simulating="isSimulating" :title="`${automataType}自动机`" />
    </div>

    <!-- 显示当前正则表达式 -->
    <div v-if="hasAutomata" class="regex-display mt-2 has-text-centered">
      <span class="tag is-info is-medium">正则表达式: {{ store.regex || '空' }}</span>
    </div>

    <!-- 模拟控制组件 -->
    <SimulationControls v-if="isSimulating && steps.length > 0" :current-state="currentState" :steps="steps"
      :current-step="currentStep" :is-accepted="isAccepted" :has-prev-step="hasPrevStep" :has-next-step="hasNextStep"
      @prev="prevStep" @next="nextStep" @reset="resetSimulation" @play-pause="togglePlayback" />

    <!-- 无自动机时的提示 -->
    <div class="notification is-info" v-if="!hasAutomata">
      <p>输入正则表达式并点击生成按钮查看自动机图</p>
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
  height: 520px;
  position: relative;
}

.chart-wrapper {
  flex-grow: 1;
  min-height: 350px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
}

.regex-display {
  margin: 0.5rem 0;
}
</style>
