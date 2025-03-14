<template>
  <div class="box" style="height: 120px;">
    <div class="field">
      <div class="control has-icons-left">
        <input class="input is-primary" type="text" placeholder="输入正则表达式，例如: a(b|c)*" v-model="regex"
          @keyup.enter="generateAutomata" />
        <span class="icon is-small is-left">
          <i class="fas fa-code"></i>
        </span>
      </div>
      <p v-if="showError" class="help is-danger">{{ errorMessage }}</p>
    </div>
    <nav class="level is-mobile mt-2">
      <div class="level-item has-text-centered">
        <button class="button is-primary" @click="generateAutomata">
          <span class="icon"><i class="fas fa-cogs"></i></span>
          <span>生成自动机</span>
        </button>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <button class="button is-info" @click="clearRegex">
            <span class="icon"><i class="fas fa-trash-alt"></i></span>
            <span>清除</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAutomataStore } from '../stores/automataStore';

const store = useAutomataStore();
const regex = ref('');
const showError = ref(false);
const errorMessage = ref('');

function generateAutomata() {
  try {
    showError.value = false;
    store.setRegex(regex.value);
    store.generateAutomata();
  } catch (e) {
    showError.value = true;
    errorMessage.value = `解析错误: ${e.message || '正则表达式无效'}`;
  }
}

function clearRegex() {
  regex.value = '';
  store.setRegex('');
  store.automata = null;
  showError.value = false;
}

// 监听store中的regex变化
watch(() => store.regex, (newValue) => {
  regex.value = newValue;
});

onMounted(() => {
  regex.value = store.regex;
});
</script>
