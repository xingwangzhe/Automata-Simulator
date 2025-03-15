<template>
  <div class="chart-container" ref="chartContainer"></div>
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

    // 添加额外的调试
    if (links.length === 0) {
      console.warn("没有连线数据");
    }

    // 设置数据并渲染图表
    renderer.value.setData(nodes, links, props.title);

    // 如果正在模拟，高亮当前状态
    if (props.currentStates.length > 0) {
      renderer.value.highlightStates(props.currentStates);
    }
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
}

// 高亮当前状态
function highlightCurrentStates() {
  if (!renderer.value) return;
  renderer.value.highlightStates(props.currentStates);
}

// 监听数据变化
watch(() => props.automata, (newAutomata, oldAutomata) => {
  // 只有自动机对象完全改变时才重新初始化图表
  if (JSON.stringify(newAutomata) !== JSON.stringify(oldAutomata)) {
    initChart();
  }
}, { deep: true });

// 监听当前状态变化，只更新高亮
watch(() => props.currentStates, () => {
  highlightCurrentStates();
}, { deep: true });

// 监听标题变化，重新设置数据
watch(() => props.title, () => {
  if (renderer.value && props.automata) {
    const { nodes, links } = convertAutomataToD3Format(props.automata);
    renderer.value.setData(nodes, links, props.title);
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
  // 添加足够长的延迟确保DOM完全挂载并有宽高
  setTimeout(() => {
    initChart();
  }, 300);

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (renderer.value) {
    renderer.value.destroy();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
  position: relative;
  background-color: #fafafa;
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
