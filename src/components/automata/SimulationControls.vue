<template>
  <div class="simulation-controls">
    <div class="notification is-light"
      :class="{ 'is-success': isAccepted, 'is-danger': !isAccepted && steps.length > 1 }">
      <p>当前状态: <strong>{{ currentState?.state || '无状态' }}</strong>
        (位置: {{ currentState?.position >= 0 ? currentState?.position + 1 : '开始' }},
        字符: {{ currentState?.character || '无' }})</p>
      <p v-if="currentStep === steps.length - 1">
        <strong>结果: {{ isAccepted ? '接受' : '拒绝' }}</strong>
      </p>
    </div>

    <div class="buttons is-centered">
      <button class="button is-info" @click="onReset">
        <span class="icon"><i class="fas fa-undo"></i></span>
        <span>重置</span>
      </button>
      <button class="button" @click="onPrevStep" :disabled="!hasPrevStep">
        <span class="icon"><i class="fas fa-step-backward"></i></span>
        <span>上一步</span>
      </button>
      <button class="button" @click="onNextStep" :disabled="!hasNextStep">
        <span>下一步</span>
        <span class="icon"><i class="fas fa-step-forward"></i></span>
      </button>
      <button class="button is-primary" @click="onPlayPause" :disabled="!hasNextStep && isPlaying">
        <span class="icon">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </span>
        <span>{{ isPlaying ? '暂停' : '播放' }}</span>
      </button>
    </div>

    <!-- 播放速度控制 -->
    <div class="field has-addons is-centered mt-2" v-if="isPlaying">
      <div class="control">
        <button class="button is-small" @click="decreaseSpeed" :disabled="playSpeed <= 1">
          <span class="icon"><i class="fas fa-minus"></i></span>
        </button>
      </div>
      <div class="control">
        <div class="button is-static is-small">
          速度: {{ playSpeed }}x
        </div>
      </div>
      <div class="control">
        <button class="button is-small" @click="increaseSpeed" :disabled="playSpeed >= 5">
          <span class="icon"><i class="fas fa-plus"></i></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  currentState: {
    type: Object,
    default: null
  },
  steps: {
    type: Array,
    default: () => []
  },
  currentStep: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  hasPrevStep: {
    type: Boolean,
    default: false
  },
  hasNextStep: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['prev', 'next', 'reset', 'play-pause']);

// 自动播放控制
const isPlaying = ref(false);
const playSpeed = ref(2);
let playInterval = null;

function onPrevStep() {
  emit('prev');
}

function onNextStep() {
  emit('next');
}

function onReset() {
  stopPlayback();
  emit('reset');
}

function onPlayPause() {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
  emit('play-pause', isPlaying.value);
}

function startPlayback() {
  if (!isPlaying.value && props.hasNextStep) {
    isPlaying.value = true;
    playInterval = setInterval(() => {
      if (props.hasNextStep) {
        emit('next');
      } else {
        stopPlayback();
      }
    }, calculatePlaybackSpeed());
  }
}

function stopPlayback() {
  if (isPlaying.value) {
    clearInterval(playInterval);
    isPlaying.value = false;
  }
}

function calculatePlaybackSpeed() {
  return 1000 / playSpeed.value;
}

function increaseSpeed() {
  if (playSpeed.value < 5) {
    playSpeed.value++;
    updatePlaybackInterval();
  }
}

function decreaseSpeed() {
  if (playSpeed.value > 1) {
    playSpeed.value--;
    updatePlaybackInterval();
  }
}

function updatePlaybackInterval() {
  if (isPlaying.value) {
    clearInterval(playInterval);
    playInterval = setInterval(() => {
      if (props.hasNextStep) {
        emit('next');
      } else {
        stopPlayback();
      }
    }, calculatePlaybackSpeed());
  }
}
</script>

<style scoped>
.simulation-controls {
  margin-top: 1rem;
  padding: 0.75rem;
  border-top: 1px solid #eee;
}

.buttons.is-centered {
  justify-content: center;
}

.field.is-centered {
  display: flex;
  justify-content: center;
}
</style>
