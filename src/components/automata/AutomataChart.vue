<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import echarts from '../../utils/echartsUtil';

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

  // 收集所有自环
  const selfLoopMap = new Map();

  // 首先识别和分组所有自环
  props.automata.transitions.forEach(transition => {
    if (transition.from === transition.to) {
      if (!selfLoopMap.has(transition.from)) {
        selfLoopMap.set(transition.from, []);
      }
      selfLoopMap.get(transition.from).push(transition.symbol);
    }
  });

  // 处理每个节点的自环 - 使自环在节点上方明显可见
  selfLoopMap.forEach((symbols, stateId) => {
    symbols.forEach((symbol, index) => {
      // 为每个自环符号生成单独的自环，但位置不同
      // 根据自环数量调整角度和方向
      const angle = (index * 45) % 360;
      const radians = angle * Math.PI / 180;

      // 计算自环的控制点，让自环成为一个明显的圆环
      const cx = Math.cos(radians) * 100; // 控制点X偏移
      const cy = Math.sin(radians) * 100; // 控制点Y偏移

      edgesMap.set(`${stateId}-self-loop-${index}`, {
        source: stateId,
        target: stateId,
        value: symbol,
        // 使用固定大小的自环，确保可见
        lineStyle: {
          width: 3,
          type: symbol === 'ε' ? 'dashed' : 'solid',
          color: '#ff7300',   // 橙色自环
          opacity: 0.9,
          curveness: 2,      // 极大的曲率确保自环明显为圆
        },
        label: {
          show: true,
          formatter: symbol,
          position: 'middle', // 自环中间显示标签
          distance: 5,
          fontSize: 14,
          color: '#333',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: [4, 7],
          borderRadius: 4,
        },
        // 明确设置自环的箭头
        symbol: ['none', 'arrow'],
        symbolSize: [0, 12],  // 增大箭头
        // 使用自定义布局控制点
        controlPoints: [{ x: cx, y: cy }]
      });
    });
  });

  // 处理非自环的转换
  props.automata.transitions.forEach(transition => {
    if (transition.from !== transition.to) {
      const key = `${transition.from}-${transition.to}`;
      const symbol = transition.symbol;

      if (edgesMap.has(key)) {
        const existingEdge = edgesMap.get(key);
        if (!existingEdge.symbol.includes(symbol)) {
          existingEdge.symbol += `, ${symbol}`;
        }
      } else {
        edgesMap.set(key, {
          source: transition.from,
          target: transition.to,
          symbol: symbol,
          isSelfLoop: false
        });
      }
    }
  });

  // 为多重边设置不同的曲率，避免重叠
  const multiEdges = new Map();

  edgesMap.forEach((edge) => {
    if (!edge.isSelfLoop) {
      const baseKey = `${edge.source}-${edge.target}`;
      const count = multiEdges.get(baseKey) || 0;
      multiEdges.set(baseKey, count + 1);

      if (count > 0) {
        // 增加曲率使多重边可见
        edge.curveness = 0.2 + (count * 0.15);
      } else {
        edge.curveness = 0.1;
      }
    }
  });

  // 转换为数组
  const edges = Array.from(edgesMap.values()).map(edge => {
    const isSelfLoop = edge.source === edge.target;

    if (isSelfLoop) {
      // 自环边 - 确保自环明显可见
      return {
        source: edge.source,
        target: edge.target,
        value: edge.value,
        // 确保自环箭头明显，用不同的样式
        symbol: ['none', 'arrow'],
        symbolSize: [0, 12],
        // 自环线条样式
        lineStyle: {
          ...edge.lineStyle,
          width: 3,
          curveness: 2,   // 极大的曲率
          smooth: true    // 平滑曲线
        },
        // 确保标签可见
        label: {
          ...edge.label,
          show: true
        }
      };
    } else {
      // 常规边的配置
      return {
        source: edge.source,
        target: edge.target,
        value: edge.value || edge.symbol,
        symbol: ['none', 'arrow'],
        symbolSize: [0, 10],
        lineStyle: {
          width: 2,
          type: (edge.value || edge.symbol) === 'ε' ? 'dashed' : 'solid',
          opacity: 0.8,
          curveness: edge.curveness || 0.2
        },
        label: {
          show: true,
          formatter: edge.value || edge.symbol,
          fontSize: 14,
          color: '#333',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: [3, 5],
          borderRadius: 4
        }
      };
    }
  });

  return { nodes, edges };
}

// 初始化图表
function initChart() {
  if (!chartContainer.value || !props.automata) return;

  const { nodes, edges } = formatAutomataData();

  if (nodes.length === 0) return;

  if (!chart.value) {
    chart.value = echarts.init(chartContainer.value);

    // 添加双击事件调整视图
    chart.value.on('dblclick', function () {
      chart.value.dispatchAction({
        type: 'graphRoam',
        zoom: 1,
        originX: 0,
        originY: 0
      });
    });
  }

  // 创建自定义图表配置
  const option = {
    title: {
      text: props.title,
      top: 'top',
      left: 'center',
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      formatter: function (params) {
        if (params.dataType === 'node') {
          return (
            `状态: ${params.name}<br/>` +
            `${params.data.isStart ? '✓ 开始状态<br/>' : ''}` +
            `${params.data.isAccepting ? '✓ 接受状态' : ''}`
          );
        } else if (params.dataType === 'edge') {
          return `转换: ${params.value || params.data.value}`;
        }
        return '';
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        restore: {},
        myTool: {
          show: true,
          title: '调整布局',
          icon: 'path://M304.1,456V300.3L130.3,300.3L243.9,414l-23,23L77,293.1L221.1,149l23,23L130.3,285.8L304.1,285.8V128.5H318.6V456H304.1zM480.5,127.9V283.6L654.3,283.6L540.7,170l23-23L707.6,290.9L563.5,435l-23-23L654.3,298.1L480.5,298.1V455.4H466V127.9H480.5z',
          onclick: function () {
            chart.value.setOption({
              series: [{
                force: {
                  layoutAnimation: true,
                  initLayout: 'circular',
                },
              }]
            });
          },
        },
      },
    },
    animationDurationUpdate: 300, // 快速动画
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        edges: edges,
        force: {
          repulsion: 1500,    // 增加节点间排斥力
          edgeLength: [150, 250], // 增加边长度
          gravity: 0.03,      // 降低重力让节点分散
          layoutAnimation: true,
          friction: 0.7,
        },
        // 启用拖拽
        draggable: true,
        // 启用缩放和平移
        roam: true,
        // 焦点样式
        focusNodeAdjacency: true, // 高亮相邻节点
        // 边的样式
        lineStyle: {
          color: '#999',
          width: 2,
          opacity: 0.7,
          curveness: 0.3,
          // 确保曲线平滑
          smooth: true
        },
        // 保证自环显示的关键设置
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        // 边标签
        edgeLabel: {
          show: true,
          formatter: '{c}',
          fontSize: 14,
          backgroundColor: '#fff',
          padding: [3, 5],
          borderRadius: 4,
        },
        // 高亮样式
        emphasis: {
          lineStyle: {
            width: 4,
            opacity: 1,
          },
          edgeLabel: {
            fontSize: 16,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        // 节点间距足够大，避免自环重叠
        nodeScaleRatio: 0.6,
        // 显著增加节点大小，让自环更清晰
        scaling: 1.1,
        // 使用圆形布局初始化节点位置
        circular: {
          rotateLabel: false
        },
        // 初始化为圆形布局，然后再用力导向调整
        initialLayout: 'circular',
      }
    ],
  };

  chart.value.setOption(option, true);

  // 手动调整自环的位置，确保可见
  setTimeout(() => {
    chart.value.resize();

    // 对于某些特殊情况，我们可能需要手动调整图形位置
    chart.value.dispatchAction({
      type: 'graphCircular',
      seriesIndex: 0
    });
  }, 200);
}

// 只高亮当前状态，不重新生成图表
function highlightCurrentStates() {
  if (!chart.value || !props.automata?.states) return;

  // 获取当前图表数据
  const option = chart.value.getOption();
  if (!option.series || !option.series[0] || !option.series[0].data) return;

  // 复制当前节点数据以进行样式更新
  const currentNodes = [...option.series[0].data];

  // 更新每个节点的高亮状态
  currentNodes.forEach(node => {
    const state = props.automata.states.find(s => s.id === node.id);
    if (!state) return;

    const isActive = props.currentStates.includes(node.id);

    // 只更新样式相关属性，保留位置和大小
    node.itemStyle = {
      ...node.itemStyle,
      borderWidth: isActive ? 5 : (state.isStart ? 4 : 1),
      borderColor: isActive ? '#ff9900' : (state.isStart ? '#ff0000' : '#999'),
      shadowBlur: isActive ? 20 : 0,
      shadowColor: isActive ? '#ffcc00' : ''
    };
  });

  // 只更新节点样式，不改变节点位置和大小
  chart.value.setOption({
    series: [{
      data: currentNodes
    }]
  }, false); // 使用false表示不合并，仅更新指定项
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

// 监听标题变化，仅更新标题
watch(() => props.title, (newTitle) => {
  if (chart.value) {
    chart.value.setOption({
      title: {
        text: newTitle
      }
    });
  }
});

// 处理窗口调整
function handleResize() {
  chart.value?.resize();
}

onMounted(() => {
  initChart();
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
