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
export function createAutomataGraphOption(
  nodes: any,
  edges: {
    source: any
    target: any
    symbol: any
    lineStyle: any
    label: {
      show: boolean
      formatter: any
      fontSize: number
      backgroundColor: string
      padding: number[]
      borderRadius: number
    }
  }[],
  title = '自动机',
) {
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
      formatter: function (params: {
        dataType: string
        name: any
        data: { isStart: any; isAccepting: any; symbol: any }
      }) {
        if (params.dataType === 'node') {
          return (
            `状态: ${params.name}<br/>` +
            `${params.data.isStart ? '✓ 开始状态<br/>' : ''}` +
            `${params.data.isAccepting ? '✓ 接受状态' : ''}`
          )
        } else if (params.dataType === 'edge') {
          return `转换: ${params.data.symbol}`
        }
        return ''
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        restore: {}, // 重置视图
      },
    },
    animationDurationUpdate: 1000,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        edges: edges,
        force: {
          repulsion: 1000, // 增加排斥力
          edgeLength: [80, 200], // 边长范围
          gravity: 0.1,
          layoutAnimation: true,
          friction: 0.6, // 添加摩擦力减缓运动
        },
        // 启用拖拽
        draggable: true,
        // 启用缩放和平移
        roam: true,
        // 焦点样式
        focus: 'adjacency',
        // 边的样式
        lineStyle: {
          color: '#999',
          width: 2,
        },
        // 鼠标悬停时的高亮样式
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        // 处理多条边的曲度
        autoCurveness: true,
        // 使用分层布局初始化节点位置
        initialLayout: 'circular',
      },
    ],
  }
}

export default echarts
