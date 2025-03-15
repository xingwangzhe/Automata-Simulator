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
  curveDirection?: number // 添加此属性，表示曲线的弯曲方向
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

    // 为节点设置随机初始位置，避免集中在一点
    this.nodes.forEach((node) => {
      if (!node.x || !node.y) {
        // 如果是首次渲染或缺少坐标，分配随机位置
        node.x = Math.random() * this.width * 0.8 + this.width * 0.1 // 在可视区域内随机分布
        node.y = Math.random() * this.height * 0.8 + this.height * 0.1
      }

      // 重置固定状态，允许节点在新布局中自由移动
      node.fx = null
      node.fy = null
    })

    // 创建节点ID到节点对象的映射
    const idToNode = new Map()
    this.nodes.forEach((node) => idToNode.set(node.id, node))

    // 对于每条边，确保source和target是对节点对象的引用
    this.links = links.map((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      // 查找对应的节点对象
      const sourceNode = idToNode.get(sourceId)
      const targetNode = idToNode.get(targetId)

      if (!sourceNode || !targetNode) {
        console.warn(`找不到节点: source=${sourceId}, target=${targetId}`)
      }

      return {
        ...link,
        source: sourceNode || sourceId, // 如果找不到节点对象，保留原始值
        target: targetNode || targetId,
      }
    })

    // 处理双向连接 - 检测相同节点间的双向边，并添加方向标记
    this.processBidirectionalLinks()

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

    // 增强力导向模拟的初始强度，确保节点充分分散
    this.simulation.force('charge', d3.forceManyBody().strength(-1000)) // 墛大排斥力
    this.simulation.force('collide', d3.forceCollide().radius(this.nodeRadius * 2)) // 墛大碰撞半径

    // 启动模拟，使用较高的初始alpha值确保充分"震荡"
    this.simulation.alpha(0.8).restart()

    // 运行一段时间后逐渐恢复正常力度
    setTimeout(() => {
      this.simulation.force('charge', d3.forceManyBody().strength(-800))
      this.simulation.force('collide', d3.forceCollide().radius(this.nodeRadius * 1.5))
      this.simulation.alpha(0.3).restart()
    }, 1000)
  }

  // 处理双向链接，为它们添加方向标记，使曲线在不同方向弯曲
  private processBidirectionalLinks() {
    // 对于所有非自环连接，设置统一的曲率
    this.links.forEach((link) => {
      if (!link.isSelfLoop) {
        // 所有非自环边使用相同的曲率值，在绘制时再决定方向
        link.curveDirection = 0.5
      }
    })

    // 记录多条相同路径的连接
    const pathCounts = new Map<string, number>()

    this.links.forEach((link) => {
      if (!link.isSelfLoop) {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
        const targetId = typeof link.target === 'object' ? link.target.id : link.target

        // 创建路径键 (不排序，保持方向)
        const pathKey = `${sourceId}->${targetId}`

        // 墛加这条路径的计数
        const count = (pathCounts.get(pathKey) || 0) + 1
        pathCounts.set(pathKey, count)

        // 如果同一方向有多条边，增大曲率以分开显示
        if (count > 1) {
          link.curveDirection = 0.2 * count
        }
      }
    })

    // 调试输出
    console.log(
      '处理后的连线数据:',
      this.links
        .filter((link) => !link.isSelfLoop)
        .map((link) => ({
          source: typeof link.source === 'object' ? link.source.id : link.source,
          target: typeof link.target === 'object' ? link.target.id : link.target,
          curve: link.curveDirection,
        })),
    )
  }

  // 计算自环路径
  private calculateSelfLoopPath(
    x: number,
    y: number,
    nodeRadius: number,
    loopIndex: number = 0,
  ): string {
    // 计算自环的半径和角度
    const loopRadius = nodeRadius * 1.5 + loopIndex * 10
    const startAngle = Math.PI / 2
    const endAngle = (Math.PI * 3) / 2

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

  // 计算自环标签位置
  private calculateSelfLoopLabelPosition(
    x: number,
    y: number,
    nodeRadius: number,
    loopIndex: number = 0,
  ): { x: number; y: number } {
    // 计算标签位置在自环弧的最高点
    const angle = -Math.PI / 4 + (loopIndex * Math.PI) / 2

    // 将标签放在自环的顶部或侧面，而不是中间
    const labelAngle = angle + Math.PI * 0.75
    const distance = nodeRadius * 2.2 // 略小于控制点的距离

    return {
      x: x + distance * Math.cos(labelAngle),
      y: y + distance * Math.sin(labelAngle),
    }
  }

  // 计算常规连线路径
  private calculateLinkPath(
    source: any,
    target: any,
    isSelfLoop: boolean,
    loopIndex: number = 0,
    curveDirection?: number,
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

    // 如果有指定的曲率方向（双向连接的情况），创建一条曲线
    if (curveDirection !== undefined) {
      // 计算控制点，使曲线在垂直于连线的方向弯曲
      const perpX = -unitDy // 垂直于连线的单位向量
      const perpY = unitDx

      // 控制点的偏移距离，根据边的长度调整
      const offset = Math.min(distance * 0.3, 50) * curveDirection

      // 关键修正: 不再考虑源目标ID大小来决定偏移方向
      // 只使用固定的偏移方向, 因为方向相反的两条边应该采用相同的偏移方向

      // 控制点位置
      const controlX = (sourceX + targetX) / 2 + perpX * offset
      const controlY = (sourceY + targetY) / 2 + perpY * offset

      // 创建二次贝塞尔曲线
      return `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`
    }

    // 无曲率方向，创建直线
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
      .attr('class', (d) => {
        let classes = d.isSelfLoop ? 'link self-loop' : 'link'

        // 添加通用的弯曲边类，无需区分上下，只区分是否有曲率
        if (!d.isSelfLoop && d.curveDirection !== undefined) {
          classes += ' curved' // 简化为一个曲线类
        }

        return classes
      })
      .attr('stroke-width', (d) => (d.isSelfLoop ? 3 : 2.5))
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 1)
      .attr('fill', 'none')
      .attr('marker-end', (d) => (d.isSelfLoop ? 'url(#arrow-loop)' : 'url(#arrow)'))
      // 添加数据属性用于调试和CSS选择器
      .attr('data-source', (d) => (typeof d.source === 'object' ? d.source.id : d.source))
      .attr('data-target', (d) => (typeof d.target === 'object' ? d.target.id : d.target))
      .attr('data-symbol', (d) => d.symbol)
      .attr('data-curve', (d) => (d.curveDirection !== undefined ? d.curveDirection : 'none'))

    // 初始化路径
    this.updateLinkPaths()

    // 渲染连线标签 - 改进标签显示
    this.linkLabels = this.container
      .select('.labels')
      .selectAll('g')
      .data(this.links)
      .join('g')
      .attr('class', (d) => (d.isSelfLoop ? 'link-label self-loop-label' : 'link-label'))
      // 初始化标签位置
      .attr('transform', (d) => {
        const source =
          typeof d.source === 'object' ? d.source : this.nodes.find((n) => n.id === d.source)
        const target =
          typeof d.target === 'object' ? d.target : this.nodes.find((n) => n.id === d.target)

        if (source && target && source.x !== undefined && target.x !== undefined) {
          if (d.isSelfLoop) {
            const loopIndex = d.loopIndex || 0
            const labelPos = this.calculateSelfLoopLabelPosition(
              source.x,
              source.y,
              this.nodeRadius,
              loopIndex,
            )
            return `translate(${labelPos.x}, ${labelPos.y})`
          } else {
            return `translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`
          }
        }
        return 'translate(0, 0)'
      })

    // 为标签添加背景矩形
    this.linkLabels.selectAll('rect').remove()
    this.linkLabels
      .append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('stroke-width', 1)
      .attr('opacity', 0.9)
      .attr('x', -20) // 提供初始尺寸
      .attr('y', -10)
      .attr('width', 40)
      .attr('height', 20)

    // 添加标签文本
    this.linkLabels.selectAll('text').remove()
    this.linkLabels
      .append('text')
      .text((d) => d.symbol)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('x', 0) // 居中于矩形
      .attr('y', 0)

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
    this.updateLinkPaths()

    // 更新连线标签位置 - 修正标签位置计算
    this.linkLabels.each((d, i, nodes) => {
      // 直接使用对象引用而不是查找
      const source =
        typeof d.source === 'object' ? d.source : this.nodes.find((n) => n.id === d.source)
      const target =
        typeof d.target === 'object' ? d.target : this.nodes.find((n) => n.id === d.target)

      if (!source || !target || source.x === undefined || target.x === undefined) {
        // 如果找不到节点或坐标，不更新位置
        return
      }

      const label = d3.select(nodes[i])
      const text = label.select('text')
      const rect = label.select('rect')

      if (d.isSelfLoop) {
        // 使用专门的方法计算自环标签位置
        const loopIndex = d.loopIndex || 0
        const labelPos = this.calculateSelfLoopLabelPosition(
          source.x,
          source.y,
          this.nodeRadius,
          loopIndex,
        )

        label.attr('transform', `translate(${labelPos.x}, ${labelPos.y})`)

        // 为自环标签添加特殊样式
        label.classed('self-loop-label', true)
      } else {
        // 常规连线的标签位置
        let x = (source.x + target.x) / 2
        let y = (source.y + target.y) / 2

        // 如果是弯曲的连线，根据曲率调整标签位置
        if (d.curveDirection !== undefined) {
          const dx = target.x - source.x
          const dy = target.y - source.y

          // 计算单位向量
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > 0) {
            // 垂直于连线的方向向量
            const perpX = -dy / distance
            const perpY = dx / distance

            // 根据曲率调整标签偏移
            const offset = Math.min(distance * 0.15, 25) * d.curveDirection

            x = x + perpX * offset
            y = y + perpY * offset
          }
        }

        label.attr('transform', `translate(${x}, ${y})`)
        label.classed('self-loop-label', false)
      }

      // 获取文本尺寸并更新背景矩形
      // 先确保文本已经渲染，才能获取其尺寸
      if (text.node()) {
        try {
          const bbox = (text.node() as SVGTextElement).getBBox()
          rect
            .attr('x', bbox.x - 6)
            .attr('y', bbox.y - 3)
            .attr('width', bbox.width + 12)
            .attr('height', bbox.height + 6)
        } catch (e) {
          console.warn('无法获取文本尺寸:', e)
        }
      }
    })
  }

  // 高亮活动状态
  public highlightStates(stateIds: string[]) {
    // 确保stateIds是数组
    const ids = Array.isArray(stateIds) ? stateIds : [stateIds].filter(Boolean)

    // 记录之前的活动状态
    const previousActive = this.nodes.filter((node) => node.isActive).map((node) => node.id)

    // 如果状态没有变化，则不需要重新渲染
    const hasChanged =
      previousActive.length !== ids.length ||
      previousActive.some((id) => !ids.includes(id)) ||
      ids.some((id) => !previousActive.includes(id))

    if (!hasChanged) return

    // 更新节点高亮状态
    this.nodes.forEach((node) => {
      node.isActive = ids.includes(node.id)
    })

    // 如果nodeElements已初始化，则更新样式
    if (this.nodeElements) {
      // 更新节点类
      this.nodeElements.attr('class', (d) => {
        let classes = 'node'
        if (d.isStart) classes += ' start'
        if (d.isAccepting) classes += ' accepting'
        if (d.isActive) classes += ' active'
        return classes
      })

      // 设置节点外观
      this.nodeElements
        .select('circle.main')
        .attr('stroke', (d) => (d.isActive ? '#ff9900' : d.isStart ? '#ff0000' : '#999'))
        .attr('stroke-width', (d) => (d.isActive ? 6 : d.isStart ? 5 : 3))
        .attr('filter', (d) => (d.isActive ? 'url(#glow)' : null))

      console.log(`高亮状态: ${ids.join(', ')}`)
    }
  }

  // 重置视图并优化布局
  public resetView(applyForceLayout = false) {
    // 重置缩放和位置
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)

    if (applyForceLayout) {
      // 重置节点固定状态，允许其自由移动
      this.nodes.forEach((node) => {
        node.fx = null
        node.fy = null
      })

      // 重新应用力导向布局
      this.simulation
        .force('charge', d3.forceManyBody().strength(-1000)) // 临时增加排斥力
        .alpha(0.8) // 设置较高初始alpha值
        .restart()

      // 稍后恢复正常设置
      setTimeout(() => {
        this.simulation.force('charge', d3.forceManyBody().strength(-800)).alpha(0.3).restart()
      }, 1000)
    }
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

  // 更新连线路径
  private updateLinkPaths() {
    this.linkElements.attr('d', (d) => {
      // 直接使用对象引用
      const source =
        typeof d.source === 'object' ? d.source : this.nodes.find((n) => n.id === d.source)
      const target =
        typeof d.target === 'object' ? d.target : this.nodes.find((n) => n.id === d.target)

      if (!source || !target || source.x === undefined || target.x === undefined) {
        console.error('无法找到节点或节点缺少坐标:', d, source, target)
        return ''
      }

      return this.calculateLinkPath(
        source,
        target,
        d.isSelfLoop,
        d.loopIndex || 0,
        d.curveDirection,
      )
    })
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
