export interface State {
  id: string
  name: string
  isStart: boolean
  isAccepting: boolean
}

export interface Transition {
  from: string
  to: string
  symbol: string
}

export interface Automata {
  states: State[]
  transitions: Transition[]
}

// 标记NFA的特殊符号
const EPSILON = 'ε'

/**
 * 将正则表达式转换为NFA（Thompson构造法）
 */
export function regexToNFA(regex: string): Automata {
  if (!regex) {
    // 处理空正则表达式
    const startState: State = {
      id: 's0',
      name: 'q0',
      isStart: true,
      isAccepting: false,
    }
    const acceptState: State = {
      id: 's1',
      name: 'q1',
      isStart: false,
      isAccepting: true,
    }

    return {
      states: [startState, acceptState],
      transitions: [{ from: 's0', to: 's1', symbol: EPSILON }],
    }
  }

  // 解析正则表达式
  let stateCounter = 0

  // 创建新状态的辅助函数
  const createState = (isStart = false, isAccepting = false): State => {
    const id = `s${stateCounter}`
    const state: State = {
      id,
      name: `q${stateCounter}`,
      isStart,
      isAccepting,
    }
    stateCounter++
    return state
  }

  // 基本NFA构建块
  const createBasicNFA = (symbol: string): Automata => {
    const startState = createState(true, false)
    const acceptState = createState(false, true)

    return {
      states: [startState, acceptState],
      transitions: [
        {
          from: startState.id,
          to: acceptState.id,
          symbol,
        },
      ],
    }
  }

  // 连接两个NFA
  const concatenate = (nfa1: Automata, nfa2: Automata): Automata => {
    // 将nfa2的开始状态的转移转移到nfa1的接受状态
    const transitions = [
      ...nfa1.transitions,
      ...nfa2.transitions.map((t) => ({
        from:
          t.from === nfa2.states.find((s) => s.isStart)?.id
            ? (nfa1.states.find((s) => s.isAccepting)?.id as string)
            : t.from,
        to: t.to,
        symbol: t.symbol,
      })),
    ]

    // 合并状态集，除了nfa2的开始状态
    const states = [
      ...nfa1.states.map((s) => (s.isAccepting ? { ...s, isAccepting: false } : s)),
      ...nfa2.states.filter((s) => !s.isStart),
    ]

    return { states, transitions }
  }

  // 创建选择NFA (|)
  const createUnion = (nfa1: Automata, nfa2: Automata): Automata => {
    const startState = createState(true, false)
    const acceptState = createState(false, true)

    // 清除原始开始和接受状态标记
    const states1 = nfa1.states.map((s) => ({
      ...s,
      isStart: false,
      isAccepting: false,
    }))

    const states2 = nfa2.states.map((s) => ({
      ...s,
      isStart: false,
      isAccepting: false,
    }))

    const nfa1Start = states1.find((s) => s.id === nfa1.states.find((state) => state.isStart)?.id)
    const nfa1Accept = states1.find(
      (s) => s.id === nfa1.states.find((state) => state.isAccepting)?.id,
    )
    const nfa2Start = states2.find((s) => s.id === nfa2.states.find((state) => state.isStart)?.id)
    const nfa2Accept = states2.find(
      (s) => s.id === nfa2.states.find((state) => state.isAccepting)?.id,
    )

    const transitions = [
      ...nfa1.transitions,
      ...nfa2.transitions,
      { from: startState.id, to: nfa1Start?.id || '', symbol: EPSILON },
      { from: startState.id, to: nfa2Start?.id || '', symbol: EPSILON },
      { from: nfa1Accept?.id || '', to: acceptState.id, symbol: EPSILON },
      { from: nfa2Accept?.id || '', to: acceptState.id, symbol: EPSILON },
    ]

    return {
      states: [startState, ...states1, ...states2, acceptState],
      transitions,
    }
  }

  // 创建闭包NFA (*)
  const createClosure = (nfa: Automata): Automata => {
    const startState = createState(true, false)
    const acceptState = createState(false, true)

    // 清除原始开始和接受状态标记
    const states = nfa.states.map((s) => ({
      ...s,
      isStart: false,
      isAccepting: false,
    }))

    const nfaStart = states.find((s) => s.id === nfa.states.find((state) => state.isStart)?.id)
    const nfaAccept = states.find((s) => s.id === nfa.states.find((state) => state.isAccepting)?.id)

    const transitions = [
      ...nfa.transitions,
      { from: startState.id, to: nfaStart?.id || '', symbol: EPSILON },
      { from: startState.id, to: acceptState.id, symbol: EPSILON },
      { from: nfaAccept?.id || '', to: nfaStart?.id || '', symbol: EPSILON },
      { from: nfaAccept?.id || '', to: acceptState.id, symbol: EPSILON },
    ]

    return {
      states: [startState, ...states, acceptState],
      transitions,
    }
  }

  // 创建一次或多次(+)
  const createOneOrMore = (nfa: Automata): Automata => {
    // a+ = aa*
    const basicNFA = nfa
    const closureNFA = createClosure(structuredClone(nfa))
    return concatenate(basicNFA, closureNFA)
  }

  // 创建零次或一次(?)
  const createZeroOrOne = (nfa: Automata): Automata => {
    const startState = createState(true, false)
    const acceptState = createState(false, true)

    // 清除原始开始和接受状态标记
    const states = nfa.states.map((s) => ({
      ...s,
      isStart: false,
      isAccepting: false,
    }))

    const nfaStart = states.find((s) => s.id === nfa.states.find((state) => state.isStart)?.id)
    const nfaAccept = states.find((s) => s.id === nfa.states.find((state) => state.isAccepting)?.id)

    const transitions = [
      ...nfa.transitions,
      { from: startState.id, to: nfaStart?.id || '', symbol: EPSILON },
      { from: startState.id, to: acceptState.id, symbol: EPSILON },
      { from: nfaAccept?.id || '', to: acceptState.id, symbol: EPSILON },
    ]

    return {
      states: [startState, ...states, acceptState],
      transitions,
    }
  }

  // 解析并构建NFA
  const parseRegex = (regex: string): Automata => {
    const stack: Automata[] = []
    const currentNFA: Automata | null = null
    const operators: string[] = []
    let i = 0

    while (i < regex.length) {
      const char = regex[i]

      switch (char) {
        case '(':
          operators.push('(')
          i++
          break

        case ')':
          while (operators.length > 0 && operators[operators.length - 1] !== '(') {
            if (operators.pop() === '|') {
              const right = stack.pop()
              const left = stack.pop()
              if (right && left) {
                stack.push(createUnion(left, right))
              }
            }
          }
          if (operators.length > 0 && operators[operators.length - 1] === '(') {
            operators.pop() // 弹出'('
          }
          i++
          break

        case '|':
          operators.push('|')
          i++
          break

        case '*':
          if (stack.length > 0) {
            const top = stack.pop()
            if (top) {
              stack.push(createClosure(top))
            }
          }
          i++
          break

        case '+':
          if (stack.length > 0) {
            const top = stack.pop()
            if (top) {
              stack.push(createOneOrMore(top))
            }
          }
          i++
          break

        case '?':
          if (stack.length > 0) {
            const top = stack.pop()
            if (top) {
              stack.push(createZeroOrOne(top))
            }
          }
          i++
          break

        case '\\':
          // 转义字符
          if (i + 1 < regex.length) {
            i++
            stack.push(createBasicNFA(regex[i]))
          }
          i++
          break

        case '.':
          // 任意字符
          stack.push(createBasicNFA('.'))
          i++
          break

        default:
          // 普通字符
          stack.push(createBasicNFA(char))
          i++

          // 处理连接（隐式运算符）
          if (
            i < regex.length &&
            regex[i] !== '*' &&
            regex[i] !== '+' &&
            regex[i] !== '?' &&
            regex[i] !== ')' &&
            regex[i] !== '|'
          ) {
            if (stack.length >= 2) {
              const right = stack.pop()
              const left = stack.pop()
              if (left && right) {
                stack.push(concatenate(left, right))
              }
            }
          }
          break
      }
    }

    // 处理剩余操作符
    while (operators.length > 0) {
      const op = operators.pop()
      if (op === '|') {
        const right = stack.pop()
        const left = stack.pop()
        if (left && right) {
          stack.push(createUnion(left, right))
        }
      }
    }

    // 处理剩余连接
    while (stack.length > 1) {
      const right = stack.pop()
      const left = stack.pop()
      if (left && right) {
        stack.push(concatenate(left, right))
      }
    }

    return stack.length > 0 ? stack[0] : createBasicNFA(EPSILON)
  }

  return parseRegex(regex)
}

/**
 * 计算NFA状态的ε-闭包
 */
function epsilonClosure(nfa: Automata, stateIds: string[]): string[] {
  const visited = new Set<string>()
  const stack = [...stateIds]

  while (stack.length > 0) {
    const stateId = stack.pop() as string
    if (!visited.has(stateId)) {
      visited.add(stateId)

      // 寻找从当前状态通过ε可达的所有状态
      nfa.transitions
        .filter((t) => t.from === stateId && t.symbol === EPSILON)
        .forEach((t) => stack.push(t.to))
    }
  }

  return Array.from(visited)
}

/**
 * 通过子集构造法将NFA转换为DFA
 */
export function NFAtoDFA(nfa: Automata): Automata {
  // 获取NFA的起始状态
  const nfaStartStateId = nfa.states.find((s) => s.isStart)?.id
  if (!nfaStartStateId) return { states: [], transitions: [] }

  // 计算起始状态的ε-闭包作为DFA的初始状态
  const initialDStateIds = epsilonClosure(nfa, [nfaStartStateId])

  // 获取所有输入符号(去除ε)
  const alphabet = new Set<string>()
  nfa.transitions.forEach((t) => {
    if (t.symbol !== EPSILON) {
      alphabet.add(t.symbol)
    }
  })

  // DFA的状态和转换
  const dfaStates: State[] = []
  const dfaTransitions: Transition[] = []

  // 用于映射NFA状态集合到DFA状态ID
  const stateSetToDfaId = new Map<string, string>()

  // 待处理的DFA状态
  const unmarkedDStates: string[][] = [initialDStateIds]
  let dfaStateCounter = 0

  // 初始状态
  const key = initialDStateIds.sort().join(',')
  stateSetToDfaId.set(key, `d${dfaStateCounter}`)

  const isAcceptingState = (stateIds: string[]): boolean => {
    return stateIds.some((id) => nfa.states.find((s) => s.id === id)?.isAccepting)
  }

  dfaStates.push({
    id: `d${dfaStateCounter}`,
    name: `D${dfaStateCounter}`,
    isStart: true,
    isAccepting: isAcceptingState(initialDStateIds),
  })

  dfaStateCounter++

  // 处理所有未标记的DFA状态
  while (unmarkedDStates.length > 0) {
    const currentStateIds = unmarkedDStates.pop() as string[]
    const currentKey = currentStateIds.sort().join(',')
    const currentDfaId = stateSetToDfaId.get(currentKey) as string

    // 对于每个输入符号
    for (const symbol of alphabet) {
      // 计算通过当前符号可达的NFA状态
      const nextStateIds = new Set<string>()

      currentStateIds.forEach((stateId) => {
        nfa.transitions
          .filter((t) => t.from === stateId && t.symbol === symbol)
          .forEach((t) => nextStateIds.add(t.to))
      })

      // 计算这些状态的ε-闭包
      const nextStateWithEpsilon = epsilonClosure(nfa, Array.from(nextStateIds))

      if (nextStateWithEpsilon.length === 0) continue

      // 生成下一个DFA状态
      const nextKey = nextStateWithEpsilon.sort().join(',')

      if (!stateSetToDfaId.has(nextKey)) {
        const newDfaId = `d${dfaStateCounter}`
        stateSetToDfaId.set(nextKey, newDfaId)

        dfaStates.push({
          id: newDfaId,
          name: `D${dfaStateCounter}`,
          isStart: false,
          isAccepting: isAcceptingState(nextStateWithEpsilon),
        })

        unmarkedDStates.push(nextStateWithEpsilon)
        dfaStateCounter++
      }

      // 添加DFA转换
      dfaTransitions.push({
        from: currentDfaId,
        to: stateSetToDfaId.get(nextKey) as string,
        symbol: symbol,
      })
    }
  }

  return { states: dfaStates, transitions: dfaTransitions }
}
