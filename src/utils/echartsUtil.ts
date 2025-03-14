/* eslint-disable @typescript-eslint/no-explicit-any */
// 按需引入ECharts模块
import * as echarts from 'echarts/core'
import { BarChart, LineChart, GraphChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必需的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  BarChart,
  LineChart,
  GraphChart, // 添加图表类型用于状态图渲染
  CanvasRenderer,
])

// 创建自动机图表默认配置的函数
export function createAutomataGraphOption(nodes: any, edges: any, title = '自动机') {
  // 处理特殊类型的边 - 特别是自环
  const processedEdges = edges.map((edge: any) => {
    // 检测是否为自环（source和target相同）
    const isSelfLoop = edge.source === edge.target

    if (isSelfLoop) {
      return {
        ...edge,
        // 确保自环明显可见
        lineStyle: {
          ...edge.lineStyle,
          curveness: 1.5, // 极大的曲率确保自环明显
          smooth: true, // 确保曲线平滑
          width: 2.5, // 稍粗一些的线
          color: '#ff7300', // 使用醒目的颜色
          opacity: 0.9,
        },
        // 确保标签位置正确且可见
        label: {
          ...edge.label,
          show: true,
          position: 'top', // 在顶部显示标签
          distance: 10, // 增加标签距离
          formatter: edge.value || edge.label?.formatter,
          fontSize: 14,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: [4, 7],
          borderRadius: 4,
        },
        // 显示明确的箭头标记
        symbol: ['circle', 'arrow'],
        symbolSize: [5, 12], // 增大箭头大小
      }
    }

    return edge
  })

  return {
    title: {
      text: title,
      top: 'top',
      left: 'center',
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      formatter: function (params: any) {
        if (params.dataType === 'node') {
          return (
            `状态: ${params.name}<br/>` +
            `${params.data.isStart ? '✓ 开始状态<br/>' : ''}` +
            `${params.data.isAccepting ? '✓ 接受状态' : ''}`
          )
        } else if (params.dataType === 'edge') {
          return `转换: ${params.value || params.data.value || params.data.label?.formatter}`
        }
        return ''
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        restore: {}, // 重置视图
        myTool: {
          show: true,
          title: '调整布局',
          icon: 'path://M304.1,456V300.3L130.3,300.3L243.9,414l-23,23L77,293.1L221.1,149l23,23L130.3,285.8L304.1,285.8V128.5H318.6V456H304.1zM480.5,127.9V283.6L654.3,283.6L540.7,170l23-23L707.6,290.9L563.5,435l-23-23L654.3,298.1L480.5,298.1V455.4H466V127.9H480.5z',
          onclick: function (chartInstance: any) {
            // 重新初始化布局
            chartInstance.setOption({
              series: [
                {
                  force: {
                    layoutAnimation: true,
                    initLayout: 'circular',
                  },
                },
              ],
            })
          },
        },
      },
    },
    animationDurationUpdate: 300, // 减少动画时间，使自环显示更快
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        edges: processedEdges, // 使用处理过的边数据
        force: {
          repulsion: 1200, // 增大排斥力
          edgeLength: [120, 250], // 边长范围更大
          gravity: 0.05, // 减小重力
          layoutAnimation: true,
          friction: 0.7, // 增加摩擦力
        },
        // 启用拖拽
        draggable: true,
        // 启用缩放和平移
        roam: true,
        // 焦点样式
        focusNodeAdjacency: true,
        // 边的样式
        lineStyle: {
          color: '#999',
          width: 2,
          opacity: 0.7,
          curveness: 0.3,
          smooth: true, // 启用平滑曲线，对自环很重要
        },
        // 配置边上箭头样式
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        // 边标签
        edgeLabel: {
          show: true,
          position: 'middle',
          formatter: '{c}',
          fontSize: 14,
          backgroundColor: '#fff',
          padding: [3, 5],
          borderRadius: 4,
        },
        // 鼠标悬停时的高亮样式
        emphasis: {
          focus: 'adjacency',
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
        // 增加节点间距
        nodeScaleRatio: 0.6,
        // 适当放大所有节点
        scaling: 1.2,
        // 使用圆形布局初始化节点位置
        circular: {
          rotateLabel: false,
        },
        initialLayout: 'circular',
      },
    ],
  }
}

export default echarts
