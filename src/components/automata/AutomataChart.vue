<template>
  <div class="chart-container bulma-bg" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, PropType, nextTick } from 'vue';
import { D3AutomataRenderer, convertAutomataToD3Format } from '../../utils/d3AutomataUtil';

const props = defineProps({
  automata: {
    type: Object,
    required: true
  },
  currentStates: {
    type: Array as PropType<string[]>,
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
const renderer = ref<D3AutomataRenderer | null>(null);

// 初始化图表
async function initChart() {
  if (!chartContainer.value || !props.automata) {
    console.error("容器或数据不存在");
    return;
  }

  // 等待下一个DOM更新周期，确保容器尺寸有效
  await nextTick();

  // 获取容器尺寸
  const container = chartContainer.value;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  console.log("容器尺寸:", width, height);

  // 清理之前的实例
  if (renderer.value) {
    renderer.value.destroy();
    renderer.value = null;
  }

  try {
    // 创建渲染器
    renderer.value = new D3AutomataRenderer(chartContainer.value, width, height);

    // 将自动机数据转换为D3格式
    const { nodes, links } = convertAutomataToD3Format(props.automata);

    // 调试输出
    console.log('D3 节点数据:', nodes);
    console.log('D3 连线数据:', links);

    // 确保有节点和连线
    if (nodes.length === 0) {
      console.error("没有节点数据");
      return;
    }

    // 设置数据并渲染图表
    renderer.value.setData(nodes, links, props.title);

    // 如果正在模拟，高亮当前状态
    if (props.isSimulating && props.currentStates && props.currentStates.length > 0) {
      renderer.value.highlightStates(props.currentStates);
    }
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
}

// 高亮当前状态
function highlightCurrentStates() {
  if (!renderer.value) return;

  if (props.currentStates && props.currentStates.length > 0) {
    console.log(`为${props.currentStates.length}个状态应用高亮:`, props.currentStates);
    renderer.value.highlightStates(props.currentStates);
  } else {
    // 移除所有高亮
    renderer.value.highlightStates([]);
  }
}

// 销毁时清理资源
onUnmounted(() => {
  if (renderer.value) {
    renderer.value.destroy();
  }
  window.removeEventListener('resize', handleResize);
});

// 强制完全重新初始化图表
function forceReinitChart() {
  console.log("强制重新初始化图表");
  // 确保容器内容清空
  if (chartContainer.value) {
    const container = chartContainer.value as HTMLElement;
    container.innerHTML = '';
  }
  // 重新初始化图表
  initChart();
}

// 监听数据变化，使用节点分布优化
watch(() => props.automata, (newAutomata, oldAutomata) => {
  const isFirstRender = !oldAutomata;
  const hasDifferentNodeCount =
    newAutomata?.states?.length !== oldAutomata?.states?.length;

  // 完全重新初始化图表
  forceReinitChart();

  // 给节点布局一些时间来初始化，然后适当调整
  setTimeout(() => {
    if (renderer.value) {
      if (hasDifferentNodeCount || isFirstRender) {
        renderer.value.resetView(true); // 应用力导向布局优化
      }
    }
  }, 300);
}, { deep: true, immediate: false });

// 监听当前状态变化，只更新高亮
watch(() => props.currentStates, (newStates) => {
  console.log("当前状态变化:", newStates);
  highlightCurrentStates();
}, { deep: true });

// 监听标题变化
watch(() => props.title, () => {
  forceReinitChart();
});

// 监听模拟状态变化
watch(() => props.isSimulating, (isSimulating) => {
  if (isSimulating) {
    // 确保在开始模拟时应用高亮
    highlightCurrentStates();
  } else {
    // 模拟结束，清除高亮
    if (renderer.value) renderer.value.highlightStates([]);
  }
});

// 处理窗口调整
function handleResize() {
  if (!chartContainer.value || !renderer.value) return;

  const container = chartContainer.value;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  renderer.value.resize(width, height);
}

onMounted(() => {
  // 检测当前模式
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log("当前模式:", isDarkMode ? "暗色" : "亮色");

  // 添加足够长的延迟确保DOM完全挂载并有宽高
  setTimeout(() => {
    initChart();
    // 初始化后应用布局优化
    setTimeout(() => {
      if (renderer.value) {
        renderer.value.resetView(true);
      }
    }, 500);
  }, 300);

  window.addEventListener('resize', handleResize);

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    console.log("主题变化为:", e.matches ? "暗色" : "亮色");
    if (renderer.value) {
      // 重新渲染以适应新主题
      initChart();
    }
  });

  // 在图表初始化后，确保应用高亮
  setTimeout(() => {
    if (props.currentStates && props.currentStates.length > 0) {
      highlightCurrentStates();
    }
  }, 500); // 给图表足够的时间来初始化
});

</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
  position: relative;
}

.bulma-bg {
  /* 使用Bulma的自适应背景色 */
  background-color: var(--bulma-bg-color, white);
}

/* 亮色模式 */
:root {
  --bulma-bg-color: #f5f5f5;
  --chart-bg: #f5f5f5;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .bulma-bg {
    background-color: #121212;
  }

  :root {
    --bulma-bg-color: #121212;
    --chart-bg: #121212;
  }
}

/* 添加样式使连线和箭头更明显 */
:deep(path.link) {
  stroke-opacity: 1 !important;
}

:deep(marker#arrow path),
:deep(marker#arrow-loop path) {
  fill-opacity: 1 !important;
}
</style>
