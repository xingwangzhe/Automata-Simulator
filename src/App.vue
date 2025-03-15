<script setup lang="ts">
import InputRegex from './components/InputRegex.vue';
import InputString from './components/InputString.vue';
import AutomataVisualizer from './components/automata/AutomataVisualizer.vue';
</script>

<template>
  <header>
    <div class="hero is-primary is-small">
      <div class="hero-body py-2">
        <div class="container">
          <p class="title is-4">
            <i class="fas fa-project-diagram mr-2"></i>
            正则表达式自动机可视化
          </p>
          <p class="subtitle is-6">
            实时转换正则表达式至DFA/NFA自动机并进行模拟,感谢Copilot的极大帮助,切换视图时,会有小卡顿
          </p>
        </div>
      </div>
      <div class="hero-foot">
        <nav class="tabs is-boxed">
          <div class="container">
            <ul>
              <li class="is-active"><a>自动机可视化</a></li>
              <li><a href="https://github.com/xingwangzhe/Automata-Simulator.git" target="_blank">项目源码</a></li>
              <li><a href="#help" @click.prevent="showHelp = true">使用帮助</a></li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  </header>

  <main class="section pt-3 pb-4">
    <div class="container">
      <div class="columns">
        <div class="column is-4">
          <!-- 左侧控制区域 -->
          <InputRegex />
          <InputString class="mt-3" style="height: auto;" />
        </div>

        <div class="column is-8">
          <!-- 右侧可视化区域 -->
          <AutomataVisualizer />
        </div>
      </div>
    </div>
  </main>

  <div class="modal" :class="{ 'is-active': showHelp }">
    <div class="modal-background" @click="showHelp = false"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">使用说明</p>
        <button class="delete" aria-label="close" @click="showHelp = false"></button>
      </header>
      <section class="modal-card-body">
        <div class="content">
          <h3>如何使用</h3>
          <ol>
            <li>在正则表达式输入框中输入表达式，支持的符号包括：
              <ul>
                <li><code>|</code> - 或运算</li>
                <li><code>*</code> - 闭包（0次或多次）</li>
                <li><code>+</code> - 正闭包（1次或多次）</li>
                <li><code>?</code> - 可选（0次或1次）</li>
                <li><code>.</code> - 任意字符</li>
                <li><code>()</code> - 分组</li>
              </ul>
            </li>
            <li>点击"生成自动机"按钮，系统会自动生成NFA和DFA图</li>
            <li>切换NFA和DFA选项卡查看不同类型的自动机</li>
            <li>在字符串输入框中输入要测试的字符串，点击"测试"按钮</li>
            <li>使用"上一步"和"下一步"按钮查看字符串处理过程</li>
          </ol>
          <h3>示例表达式</h3>
          <ul>
            <li><code>a(b|c)*</code> - 以a开头，后跟0个或多个b或c</li>
            <li><code>(a|b)*abb</code> - 以abb结尾，前面有0个或多个a或b</li>
            <li><code>a?b+c</code> - 0个或1个a，后跟1个或多个b，最后是c</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      showHelp: false
    }
  }
}
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* 减小头部占用的空间 */
.hero.is-small .hero-body {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

/* 调整section的内边距 */
.section.pt-3 {
  padding-top: 1rem;
}

.section.pb-4 {
  padding-bottom: 1.5rem;
}
</style>
