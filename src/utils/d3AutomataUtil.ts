import * as d3 from 'd3'

export interface Node {
  id: string
  name: string
  isStart?: boolean
  isAccepting?: boolean
  isActive?: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface Link {
  source: string | Node
  target: string | Node
  symbol: string
  isSelfLoop?: boolean
  loopIndex?: number
}

export class D3AutomataRenderer {
  private svg: any
  private width: number
  private height: number
  private simulation: any
  private nodes: Node[] = []
  private links: Link[] = []
  private nodeElements: any
  private linkElements: any
  private linkLabels: any
  private nodeRadius = 30
  private zoom: any
  private container: any
  private tooltipDiv: any

  constructor(containerSelector: string, width: number = 800, height: number = 600) {
    this.width = width
    this.height = height

    // 创建图表容器
    this.svg = d3
      .select(containerSelector)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // 添加缩放功能
    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.container.attr('transform', event.transform)
      })

    this.svg.call(this.zoom)

    // 创建主容器
    this.container = this.svg.append('g')

    // 创建节点、连线和连线标签的容器
    this.container.append('g').attr('class', 'links')
    this.container.append('g').attr('class', 'labels')
    this.container.append('g').attr('class', 'nodes')

    // 添加标题
    this.svg
      .append('text')
      .attr('class', 'title')
      .attr('x', this.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')

    // 创建提示框
    this.tooltipDiv = d3
      .select('body')
      .append('div')
      .attr('class', 'automata-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('transition', 'opacity 0.2s')

    // 初始化力导向模拟
    this.initSimulation()
  }

  // 初始化力导向模拟
  private initSimulation() {
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force(
        'link',
        d3
          .forceLink(this.links)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collide', d3.forceCollide().radius(this.nodeRadius * 1.5))
  }

  // 设置图表数据
  public setData(nodes: Node[], links: Link[], title: string = '自动机') {
    // 清除现有数据
    this.simulation.stop()

    // 转换数据格式 - 确保source和target是对象引用而非字符串
    this.nodes = [...nodes]

    // 处理连线 - 确保使用对象引用
    const idToNode = new Map()
    this.nodes.forEach((node) => idToNode.set(node.id, node))

    this.links = links.map((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      return {
        ...link,
        source: idToNode.get(sourceId),
        target: idToNode.get(targetId),
      }
    })

    // 确保连线的source和target是节点对象而非字符串
    console.log('处理后的连线数据:', this.links)

    // 设置图表标题
    this.svg.select('.title').text(title)

    // 重绘图表
    this.render()

    // 重启模拟
    this.simulation.nodes(this.nodes)
    this.simulation.force('link').links(this.links)
    this.simulation.alpha(1).restart()
  }

  // 计算自环路径
  private calculateSelfLoopPath(
    x: number,
    y: number,
    nodeRadius: number,
    loopIndex: number = 0,
  ): string {
    const loopRadius = nodeRadius * 1.5
    const startAngle = -Math.PI / 4 + (loopIndex * Math.PI) / 2
    const endAngle = startAngle + Math.PI * 1.5

    // 计算起点和终点
    const startX = x + nodeRadius * Math.cos(startAngle)
    const startY = y + nodeRadius * Math.sin(startAngle)
    const endX = x + nodeRadius * Math.cos(endAngle)
    const endY = y + nodeRadius * Math.sin(endAngle)

    // 使用贝塞尔曲线创建环路
    const controlX1 = x + loopRadius * 2.5 * Math.cos(startAngle - Math.PI / 8)
    const controlY1 = y + loopRadius * 2.5 * Math.sin(startAngle - Math.PI / 8)
    const controlX2 = x + loopRadius * 2.5 * Math.cos(endAngle + Math.PI / 8)
    const controlY2 = y + loopRadius * 2.5 * Math.sin(endAngle + Math.PI / 8)

    return `M ${startX},${startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`
  }

  // 计算常规连线路径
  private calculateLinkPath(
    source: any,
    target: any,
    isSelfLoop: boolean,
    loopIndex: number = 0,
  ): string {
    // 调试输出
    console.log('计算路径:', source, target, isSelfLoop)

    if (isSelfLoop) {
      return this.calculateSelfLoopPath(source.x, source.y, this.nodeRadius, loopIndex)
    }

    // 确保source和target都有坐标
    if (!source || !target || source.x === undefined || target.x === undefined) {
      console.error('缺少坐标:', source, target)
      return ''
    }

    // 计算源点和目标点的方向向量
    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) {
      console.error('距离为零:', source, target)
      return ''
    }

    // 归一化方向向量
    const unitDx = dx / distance
    const unitDy = dy / distance

    // 节点边缘坐标（考虑节点半径）
    const sourceX = source.x + this.nodeRadius * unitDx
    const sourceY = source.y + this.nodeRadius * unitDy
    const targetX = target.x - (this.nodeRadius + 5) * unitDx
    const targetY = target.y - (this.nodeRadius + 5) * unitDy

    return `M ${sourceX},${sourceY} L ${targetX},${targetY}`
  }

  // 创建箭头标记
  private createMarkerDefs() {
    // 删除已存在的定义
    this.svg.selectAll('defs').remove()

    const defs = this.svg.append('defs')

    // 添加阴影滤镜效果
    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%')

    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur')

    filter
      .append('feComposite')
      .attr('in', 'blur')
      .attr('in2', 'SourceGraphic')
      .attr('operator', 'over')

    // 常规箭头
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10) // 墛大，使箭头不会位于节点内部
      .attr('refY', 0)
      .attr('markerWidth', 10) // 墛大尺寸
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'arrow-head')

    // 自环箭头（更大、更明显）
    defs
      .append('marker')
      .attr('id', 'arrow-loop')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 12) // 墛大refX确保箭头正确位置
      .attr('refY', 0)
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'arrow-head-loop')
  }

  // 渲染图表
  private render() {
    // 创建箭头标记定义
    this.createMarkerDefs()

    console.log('渲染图表, 节点:', this.nodes.length, '连线:', this.links.length)

    // 渲染连线
    this.linkElements = this.container
      .select('.links')
      .selectAll('path')
      .data(this.links)
      .join('path')
      .attr('class', (d) => (d.isSelfLoop ? 'link self-loop' : 'link'))
      .attr('stroke-width', (d) => (d.isSelfLoop ? 3 : 2.5))
      .attr('stroke-dasharray', '5,5') // 所有连线都使用虚线
      .attr('opacity', 1)
      .attr('fill', 'none')
      .attr('marker-end', (d) => (d.isSelfLoop ? 'url(#arrow-loop)' : 'url(#arrow)'))
      // 添加调试信息
      .attr('data-source', (d) => (typeof d.source === 'object' ? d.source.id : d.source))
      .attr('data-target', (d) => (typeof d.target === 'object' ? d.target.id : d.target))
      .attr('data-symbol', (d) => d.symbol)

    // 渲染连线标签 - 改进标签显示
    this.linkLabels = this.container
      .select('.labels')
      .selectAll('g')
      .data(this.links)
      .join('g')
      .attr('class', 'link-label')

    // 为标签添加背景矩形
    this.linkLabels.selectAll('rect').remove()
    this.linkLabels
      .append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('stroke-width', 1)
      .attr('opacity', 0.9)

    // 添加标签文本
    this.linkLabels.selectAll('text').remove()
    this.linkLabels
      .append('text')
      .text((d) => d.symbol)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')

    // 渲染节点
    this.nodeElements = this.container
      .select('.nodes')
      .selectAll('.node')
      .data(this.nodes)
      .join('g')
      .attr('class', (d) => {
        let classes = 'node'
        if (d.isStart) classes += ' start'
        if (d.isAccepting) classes += ' accepting'
        if (d.isActive) classes += ' active'
        return classes
      })
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0)
          }),
      )
      .on('mouseenter', (event, d) => {
        // 显示提示框
        this.tooltipDiv.transition().duration(200).style('opacity', 0.9)
        this.tooltipDiv
          .html(
            `
          <div><strong>状态: ${d.name}</strong></div>
          ${d.isStart ? '<div>✓ 开始状态</div>' : ''}
          ${d.isAccepting ? '<div>✓ 接受状态</div>' : ''}
        `,
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px')
      })
      .on('mouseleave', () => {
        // 隐藏提示框
        this.tooltipDiv.transition().duration(500).style('opacity', 0)
      })

    // 绘制节点外圈（接受状态有双圈）
    this.nodeElements.selectAll('circle.outer').remove()
    this.nodeElements
      .filter((d) => d.isAccepting)
      .append('circle')
      .attr('class', 'outer')
      .attr('r', this.nodeRadius + 6)
      .attr('fill', 'none')
      .attr('stroke', '#91cc75')
      .attr('stroke-width', 3)

    // 绘制节点主体
    this.nodeElements.selectAll('circle.main').remove()
    this.nodeElements
      .append('circle')
      .attr('class', 'main')
      .attr('r', this.nodeRadius)
      .attr('fill', (d) => (d.isAccepting ? '#91cc75' : '#5470c6'))
      .attr('stroke', (d) => (d.isActive ? '#ff9900' : d.isStart ? '#ff0000' : '#999'))
      .attr('stroke-width', (d) => (d.isActive ? 6 : d.isStart ? 5 : 3)) // 墛加描边粗细

    // 添加节点标签
    this.nodeElements.selectAll('text').remove()
    this.nodeElements
      .append('text')
      .text((d) => d.name + (d.isAccepting ? ' (接受)' : ''))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')

    // 更新模拟的tick事件处理
    this.simulation.on('tick', () => this.updatePositions())
  }

  // 更新节点和连线位置
  private updatePositions() {
    // 更新节点位置
    this.nodeElements.attr('transform', (d) => `translate(${d.x}, ${d.y})`)

    // 更新连线路径
    this.linkElements.attr('d', (d) => {
      // 判断source和target是对象还是字符串
      const source =
        typeof d.source === 'object' ? d.source : this.nodes.find((n) => n.id === d.source)
      const target =
        typeof d.target === 'object' ? d.target : this.nodes.find((n) => n.id === d.target)

      if (!source || !target || source.x === undefined || target.x === undefined) {
        console.error('无法找到节点或节点缺少坐标:', d, source, target)
        return ''
      }

      return this.calculateLinkPath(source, target, d.isSelfLoop, d.loopIndex || 0)
    })

    // 更新连线标签位置
    this.linkLabels.each((d, i, nodes) => {
      const source = this.nodes.find((n) => n.id === d.source)
      const target = this.nodes.find((n) => n.id === d.target)
      if (!source || !target) return

      const label = d3.select(nodes[i])
      const text = label.select('text')
      const rect = label.select('rect')

      if (d.isSelfLoop) {
        // 计算自环标签位置
        const loopIndex = d.loopIndex || 0
        const angle = -Math.PI / 4 + (loopIndex * Math.PI) / 2 + Math.PI * 0.75
        const distance = this.nodeRadius * 2.5
        const x = source.x + distance * Math.cos(angle)
        const y = source.y + distance * Math.sin(angle)

        label.attr('transform', `translate(${x}, ${y})`)
      } else {
        // 常规连线的标签位置
        const x = (source.x + target.x) / 2
        const y = (source.y + target.y) / 2

        label.attr('transform', `translate(${x}, ${y})`)
      }

      // 获取文本尺寸
      const bbox = (text.node() as SVGTextElement).getBBox()

      // 更新标签背景矩形尺寸
      rect
        .attr('x', bbox.x - 6)
        .attr('y', bbox.y - 3)
        .attr('width', bbox.width + 12)
        .attr('height', bbox.height + 6)
    })
  }

  // 高亮活动状态
  public highlightStates(stateIds: string[]) {
    this.nodes.forEach((node) => {
      node.isActive = stateIds.includes(node.id)
    })

    // 更新节点类
    this.nodeElements.attr('class', (d) => {
      let classes = 'node'
      if (d.isStart) classes += ' start'
      if (d.isAccepting) classes += ' accepting'
      if (d.isActive) classes += ' active'
      return classes
    })

    this.nodeElements
      .select('circle.main')
      .attr('stroke', (d) => (d.isActive ? '#ff9900' : d.isStart ? '#ff0000' : '#999'))
      .attr('stroke-width', (d) => (d.isActive ? 6 : d.isStart ? 5 : 3))
      .attr('filter', (d) => (d.isActive ? 'url(#glow)' : null))
  }

  // 重置视图（缩放和位置）
  public resetView() {
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)
  }

  // 更改图表大小（响应窗口大小变化）
  public resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.svg.attr('viewBox', `0 0 ${width} ${height}`)
    this.simulation.force('center', d3.forceCenter(width / 2, height / 2))
    this.simulation.alpha(0.3).restart()
  }

  // 清理资源（组件销毁时调用）
  public destroy() {
    if (this.simulation) this.simulation.stop()
    if (this.tooltipDiv) this.tooltipDiv.remove()
  }
}

// 自动机数据转换为D3格式
export function convertAutomataToD3Format(automata: any) {
  if (!automata || !automata.states) return { nodes: [], links: [] }

  // 创建节点
  const nodes = automata.states.map((state: any) => ({
    id: state.id,
    name: state.name,
    isStart: state.isStart,
    isAccepting: state.isAccepting,
    isActive: false,
  }))

  // 准备边数据
  const links: Link[] = []

  // 收集自环数据，用于追踪每个节点有多少个自环
  const selfLoopCounts: { [key: string]: number } = {}

  // 处理转换
  if (automata.transitions) {
    automata.transitions.forEach((transition: any) => {
      const isSelfLoop = transition.from === transition.to

      if (isSelfLoop) {
        // 记录自环数量
        if (!selfLoopCounts[transition.from]) {
          selfLoopCounts[transition.from] = 0
        }
        selfLoopCounts[transition.from]++

        // 为自环转换创建边
        links.push({
          source: transition.from,
          target: transition.to,
          symbol: transition.symbol,
          isSelfLoop: true,
          loopIndex: selfLoopCounts[transition.from] - 1, // 从0开始
        })
      } else {
        // 处理普通转换
        links.push({
          source: transition.from,
          target: transition.to,
          symbol: transition.symbol,
          isSelfLoop: false,
        })
      }
    })
  }

  return { nodes, links }
}
