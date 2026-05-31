<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-icon">🏯</div>
      </div>
      <h2 class="loading-title">中式古建筑院落</h2>
      <p class="loading-text">正在构建三维场景...</p>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const progress = ref(0)

onMounted(() => {
  const interval = setInterval(() => {
    progress.value += Math.random() * 15
    if (progress.value >= 95) {
      progress.value = 95
      clearInterval(interval)
    }
  }, 150)
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1510 0%, #2a1f15 50%, #1a1510 100%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  color: #ffd700;
}

.loading-spinner {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #ffd700;
  border-right-color: rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border: 3px solid transparent;
  border-top-color: #d4a84b;
  border-right-color: rgba(212, 168, 75, 0.3);
  border-radius: 50%;
  animation: spin 0.8s linear infinite reverse;
}

.spinner-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
}

.loading-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  letter-spacing: 4px;
}

.loading-text {
  font-size: 14px;
  color: #d4a84b;
  margin: 0 0 30px 0;
  opacity: 0.8;
  letter-spacing: 2px;
}

.loading-progress {
  width: 300px;
  margin: 0 auto;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.progress-text {
  font-size: 12px;
  color: #d4a84b;
  font-family: 'Consolas', monospace;
}
</style>
