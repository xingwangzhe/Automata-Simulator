<template>
  <div class="box" style="height: 120px;">
    <div class="field">
      <div class="control has-icons-left">
        <input class="input is-primary" type="text" placeholder="输入待测试的字符串" v-model="inputString"
          :disabled="!hasAutomata" @keyup.enter="testString" />
        <span class="icon is-small is-left">
          <i class="fas fa-keyboard"></i>
        </span>
      </div>
      <p v-if="!hasAutomata" class="help is-warning">请先生成自动机</p>
    </div>
    <nav class="level is-mobile mt-2">
      <div class="level-item has-text-centered">
        <button class="button is-primary" @click="testString" :disabled="!hasAutomata || !inputString">
          <span class="icon"><i class="fas fa-play"></i></span>
          <span>测试</span>
        </button>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <button class="button is-info" @click="clearString">
            <span class="icon"><i class="fas fa-trash-alt"></i></span>
            <span>清除</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useAutomataStore } from '../stores/automataStore';

const store = useAutomataStore();
const inputString = ref('');
const hasAutomata = computed(() =>
  store.automata && store.automata.states && store.automata.states.length > 0
);

function testString() {
  if (hasAutomata.value) {
    store.setInputString(inputString.value);
    store.startSimulation();
  }
}

function clearString() {
  inputString.value = '';
  store.setInputString('');
  store.resetSimulation();
}

// 监听store中的inputString变化
watch(() => store.inputString, (newValue) => {
  inputString.value = newValue;
});

onMounted(() => {
  inputString.value = store.inputString;
});
</script>
