import { defineStore } from 'pinia'
import { regexToNFA, NFAtoDFA } from '../utils/automataConverter'

export const useAutomataStore = defineStore('automata', {
  state: () => ({
    inputString: '', // 待测试的字符串
    regex: '', // 正则表达式
    isAccepted: false, // 字符串是否被自动机接受
    automataType: 'DFA', // 自动机类型：DFA、NFA 等
    steps: [], // 模拟步骤
    currentStep: 0, // 当前步骤
    isSimulating: false, // 是否正在进行模拟
    automata: null, // 存储自动机数据
  }),

  getters: {
    // 获取当前状态
    currentState(state) {
      if (!state.steps.length) return null
      return state.steps[state.currentStep]
    },

    // 自动机是否有下一步
    hasNextStep(state) {
      return state.currentStep < state.steps.length - 1
    },

    // 自动机是否有上一步
    hasPrevStep(state) {
      return state.currentStep > 0
    },
  },

  actions: {
    // 设置输入字符串
    setInputString(value: string) {
      this.inputString = value
    },

    // 设置正则表达式
    setRegex(value: string) {
      this.regex = value
    },

    // 开始模拟
    startSimulation() {
      this.isSimulating = true
      this.currentStep = 0
      this.steps = []
      this.analyze()
    },

    // 分析输入串是否被接受
    analyze() {
      if (!this.automata) {
        this.generateAutomata()
      }

      if (!this.automata || this.inputString === undefined) {
        this.isAccepted = false
        this.steps = []
        return
      }

      const automata = this.automataType === 'NFA' ? this.automata.nfa : this.automata.dfa

      // 获取初始状态
      const initialState = automata.states.find((s) => s.isStart)
      if (!initialState) {
        this.isAccepted = false
        this.steps = []
        return
      }

      const steps = []
      let currentStates = [initialState.id]

      // 计算ε闭包的辅助函数
      const computeEpsilonClosure = (stateIds) => {
        const closure = [...stateIds]
        const stack = [...stateIds]

        while (stack.length > 0) {
          const currentId = stack.pop()
          const epsilonTransitions = automata.transitions.filter(
            (t) => t.from === currentId && t.symbol === 'ε',
          )

          for (const t of epsilonTransitions) {
            if (!closure.includes(t.to)) {
              closure.push(t.to)
              stack.push(t.to)
            }
          }
        }

        return closure
      }

      // 对于NFA，计算初始状态的ε闭包
      if (this.automataType === 'NFA') {
        currentStates = computeEpsilonClosure(currentStates)
      }

      // 检查初始状态是否为接受状态（处理空输入字符串的情况）
      const initialIsAccepting = currentStates.some(
        (stateId) => automata.states.find((s) => s.id === stateId)?.isAccepting,
      )

      // 添加初始步骤
      steps.push({
        state: currentStates
          .map((id) => automata.states.find((s) => s.id === id)?.name || id)
          .join(','),
        position: -1,
        character: '',
        currentStates,
        accepted: this.inputString.length === 0 ? initialIsAccepting : false,
      })

      // 如果输入为空，则直接根据初始状态确定接受性
      if (this.inputString.length === 0) {
        this.steps = steps
        this.isAccepted = initialIsAccepting
        return
      }

      // 模拟输入字符串的处理
      let accepted = false
      for (let i = 0; i < this.inputString.length; i++) {
        const char = this.inputString[i]
        const nextStates = []

        for (const stateId of currentStates) {
          // 查找所有匹配当前字符的转换
          const matchingTransitions = automata.transitions.filter(
            (t) => t.from === stateId && (t.symbol === char || (t.symbol === '.' && char !== '')),
          )

          for (const t of matchingTransitions) {
            if (!nextStates.includes(t.to)) {
              nextStates.push(t.to)
            }
          }
        }

        // 对于NFA，计算得到的状态集的ε闭包
        if (this.automataType === 'NFA') {
          currentStates = computeEpsilonClosure(nextStates)
        } else {
          currentStates = nextStates
        }

        // 检查当前步骤是否接受
        const isAcceptingState = currentStates.some(
          (stateId) => automata.states.find((s) => s.id === stateId)?.isAccepting,
        )

        // 如果是最后一个字符并且在接受状态，则输入被接受
        if (i === this.inputString.length - 1) {
          accepted = isAcceptingState
        }

        steps.push({
          state: currentStates
            .map((id) => automata.states.find((s) => s.id === id)?.name || id)
            .join(','),
          position: i,
          character: char,
          currentStates,
          accepted: i === this.inputString.length - 1 ? accepted : false,
        })

        // 如果没有下一步可走，提前结束
        if (currentStates.length === 0) {
          break
        }
      }

      this.steps = steps
      this.isAccepted = accepted
    },

    // 前进一步
    nextStep() {
      if (this.hasNextStep) {
        this.currentStep++
      }
    },

    // 后退一步
    prevStep() {
      if (this.hasPrevStep) {
        this.currentStep--
      }
    },

    // 重置模拟
    resetSimulation() {
      this.isSimulating = false
      this.steps = []
      this.currentStep = 0
    },

    // 设置自动机类型
    setAutomataType(type: string) {
      this.automataType = type
      // 如果已经有automata，重新分析
      if (this.automata && this.isSimulating) {
        this.analyze()
      }
    },

    // 从正则表达式生成自动机
    generateAutomata() {
      if (!this.regex) {
        this.automata = null
        return
      }

      try {
        // 从正则表达式生成NFA
        const nfa = regexToNFA(this.regex)

        // 从NFA转换到DFA
        const dfa = NFAtoDFA(nfa)

        this.automata = {
          nfa: nfa,
          dfa: dfa,
          states: this.automataType === 'NFA' ? nfa.states : dfa.states,
          transitions: this.automataType === 'NFA' ? nfa.transitions : dfa.transitions,
        }

        // 如果正在模拟，重新分析
        if (this.isSimulating) {
          this.analyze()
        }
      } catch (e) {
        console.error('生成自动机时出错:', e)
        this.automata = null
      }
    },
  },
})
