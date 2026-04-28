<template>
  <div class="game-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
      @keydown="handleKeyDown"
      tabindex="0"
    ></canvas>
    <div class="game-info">
      <div class="controls-info">
        <h3>键位说明</h3>
        <ul>
          <li><strong>← →</strong> 或 <strong>A D</strong> - 移动挡板</li>
          <li><strong>空格</strong> - 发射小球</li>
          <li><strong>P</strong> 或 <strong>ESC</strong> - 暂停/继续</li>
          <li><strong>R</strong> - 重新开始</li>
          <li><strong>M</strong> - 返回主菜单</li>
        </ul>
      </div>
      <div class="powerup-info">
        <h3>道具说明</h3>
        <ul>
          <li><span class="icon green">+</span> 挡板变长</li>
          <li><span class="icon red">-</span> 挡板变短</li>
          <li><span class="icon purple">></span> 小球加速</li>
          <li><span class="icon red">♥</span> 额外生命</li>
          <li><span class="icon blue">•</span> 穿透球</li>
          <li><span class="icon yellow">○</span> 多球模式</li>
        </ul>
      </div>
      <div class="brick-info">
        <h3>砖块类型</h3>
        <ul>
          <li><span class="brick-normal"></span> 普通砖块 - 100分</li>
          <li><span class="brick-multihp"></span> 多血量砖块 - 显示血量</li>
          <li><span class="brick-unbreakable"></span> 不可破坏砖块</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GameEngine } from '@/game/GameEngine'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/levels'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = CANVAS_WIDTH
const canvasHeight = CANVAS_HEIGHT

let gameEngine: GameEngine | null = null

const handleKeyDown = (e: KeyboardEvent) => {
  if (gameEngine) {
    gameEngine.handleKeyPress(e.key)
  }
}

onMounted(() => {
  if (canvasRef.value) {
    gameEngine = new GameEngine(canvasRef.value)
    gameEngine.start()
    canvasRef.value.focus()
  }
})

onUnmounted(() => {
  if (gameEngine) {
    gameEngine.destroy()
    gameEngine = null
  }
})
</script>

<style scoped>
.game-container {
  display: flex;
  gap: 30px;
  padding: 20px;
}

.game-canvas {
  border: 4px solid #3498db;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(52, 152, 219, 0.5);
  outline: none;
}

.game-canvas:focus {
  border-color: #2ecc71;
  box-shadow: 0 0 30px rgba(46, 204, 113, 0.5);
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 280px;
}

.controls-info,
.powerup-info,
.brick-info {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
}

h3 {
  color: #3498db;
  margin: 0 0 10px 0;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  color: #aaa;
  font-size: 13px;
  padding: 4px 0;
  line-height: 1.5;
}

li strong {
  color: #fff;
  background: rgba(52, 152, 219, 0.3);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  font-weight: bold;
  font-size: 12px;
}

.icon.green {
  background: #27ae60;
  color: white;
}

.icon.red {
  background: #c0392b;
  color: white;
}

.icon.purple {
  background: #8e44ad;
  color: white;
}

.icon.blue {
  background: #3498db;
  color: white;
}

.icon.yellow {
  background: #f39c12;
  color: white;
}

.brick-normal,
.brick-multihp,
.brick-unbreakable {
  display: inline-block;
  width: 30px;
  height: 10px;
  margin-right: 8px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.brick-normal {
  background: #e74c3c;
}

.brick-multihp {
  background: #f39c12;
}

.brick-unbreakable {
  background: #6c757d;
}
</style>
