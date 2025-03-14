<template>
  <div class="chart-container" ref="chartContainer" style="width: 100%; height: 400px;"></div>
</template>

<script lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const chartContainer = ref(null);
let chartInstance = null;

onMounted(() => {
  // 初始化图表
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);

    // 设置图表配置项
    const option = {
      title: {
        text: '自动机状态转换'
      },
      tooltip: {},
      xAxis: {
        data: ['状态1', '状态2', '状态3', '状态4', '状态5']
      },
      yAxis: {},
      series: [{
        name: '访问次数',
        type: 'bar',
        data: [5, 20, 36, 10, 10]
      }]
    };

    // 使用配置项显示图表
    chartInstance.setOption(option);
  }
});

// 组件卸载时销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

// 窗口大小变化时重新调整图表大小
window.addEventListener('resize', () => {
  if (chartInstance) {
    chartInstance.resize();
  }
});
</script>

<style scoped>
.chart-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
