/**
 * 调试工具，帮助可视化自动机图
 */
export function debugAutomata(automata: any) {
  if (!automata) {
    console.log('没有自动机数据')
    return
  }

  console.log(`====== 调试自动机 ======`)

  // 打印节点信息
  console.log(`节点数量: ${automata.states?.length || 0}`)
  automata.states?.forEach((state: any, index: number) => {
    console.log(`节点 ${index + 1}:`, {
      id: state.id,
      name: state.name,
      isStart: state.isStart,
      isAccepting: state.isAccepting,
    })
  })

  // 打印转换信息
  console.log(`转换数量: ${automata.transitions?.length || 0}`)
  automata.transitions?.forEach((transition: any, index: number) => {
    console.log(`转换 ${index + 1}:`, {
      from: transition.from,
      to: transition.to,
      symbol: transition.symbol,
      isSelfLoop: transition.from === transition.to,
    })
  })

  // 检查问题
  const problems = []

  // 检查节点ID唯一性
  const nodeIds = new Set()
  automata.states?.forEach((state: any) => {
    if (nodeIds.has(state.id)) {
      problems.push(`节点ID重复: ${state.id}`)
    }
    nodeIds.add(state.id)
  })

  // 检查转换的from和to是否存在
  automata.transitions?.forEach((transition: any, index: number) => {
    if (!nodeIds.has(transition.from)) {
      problems.push(`转换 ${index + 1} 的源节点不存在: ${transition.from}`)
    }
    if (!nodeIds.has(transition.to)) {
      problems.push(`转换 ${index + 1} 的目标节点不存在: ${transition.to}`)
    }
  })

  if (problems.length > 0) {
    console.warn('发现问题:')
    problems.forEach((problem, index) => {
      console.warn(`${index + 1}. ${problem}`)
    })
  } else {
    console.log('未发现明显问题')
  }

  console.log(`=========================`)
}
