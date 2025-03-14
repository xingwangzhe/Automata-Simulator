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
          return `转换: ${params.data.label.formatter}`
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
          edgeLength: [100, 200], // 边长范围
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
          opacity: 0.7,
          curveness: 0,
        },
        // 配置边上箭头样式
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        // 边标签
        edgeLabel: {
          show: true,
          formatter: '{c}',
          fontSize: 12,
          backgroundColor: '#fff',
          borderRadius: 4,
          padding: [2, 4],
        },
        // 鼠标悬停时的高亮样式
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
            opacity: 1,
          },
          edgeLabel: {
            fontSize: 14,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        // 处理多条边的曲度
        autoCurveness: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
        // 使用分层布局初始化节点位置
        initialLayout: 'circular',
      },
    ],
  }
}

export default echarts
