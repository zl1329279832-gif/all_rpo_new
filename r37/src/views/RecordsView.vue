
<template>
  <div class="records-view">
    <div class="panel">
      <div class="head">
        <h2>本地战绩</h2>
        <div class="stats">
          <span class="tag">总计 {{ records.battles.length }}</span>
          <span class="tag">胜利 {{ wins }}</span>
          <span class="tag">失败 {{ losses }}</span>
          <span class="tag">平局 {{ draws }}</span>
        </div>
        <div class="actions">
          <button class="btn" @click="reload">刷新</button>
          <button class="btn danger" @click="clearAll" v-if="records.battles.length">清空</button>
          <router-link class="btn" to="/">返回首页</router-link>
        </div>
      </div>
      <table v-if="records.battles.length" class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>结果</th>
            <th>回合数</th>
            <th>玩家 HP</th>
            <th>敌方 HP</th>
            <th>卡组</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in records.battles" :key="r.timestamp">
            <td>{{ fmt(r.timestamp) }}</td>
            <td :class="resultClass(r.winner)">{{ resultText(r.winner) }}</td>
            <td>{{ r.turnCount }}</td>
            <td>{{ r.playerHpLeft }}</td>
            <td>{{ r.enemyHpLeft }}</td>
            <td>{{ deckName(r.deckKey) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无战绩记录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { loadRecords, clearRecords } from '@/game/records'
import { DECK_PRESETS } from '@/data/decks'
import type { BattleResult } from '@/types/game'

const records = loadRecords()

const wins = computed(() => records.battles.filter((r) => r.winner === 0).length)
const losses = computed(() => records.battles.filter((r) => r.winner === 1).length)
const draws = computed(() => records.battles.filter((r) => r.winner === 'draw').length)

function fmt(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function resultText(w: BattleResult['winner']) {
  return w === 0 ? '胜利' : w === 1 ? '失败' : '平局'
}
function resultClass(w: BattleResult['winner']) {
  return w === 0 ? 'win' : w === 1 ? 'lose' : 'draw'
}
function deckName(key: string) {
  return DECK_PRESETS[key]?.name ?? key
}
function reload() {
  window.location.reload()
}
function clearAll() {
  if (confirm('确定清空所有本地战绩？')) {
    clearRecords()
    reload()
  }
}

onMounted(() => {
  // ensure data is current
})
</script>

<style scoped>
.records-view {
  min-height: 100vh;
  padding: 40px 20px;
  background:
    radial-gradient(circle at 10% 10%, rgba(122, 167, 255, 0.1), transparent 50%),
    linear-gradient(180deg, #0a0b14 0%, #0c0f22 100%);
  display: grid;
  justify-items: center;
}
.panel {
  width: min(900px, 100%);
  padding: 20px 24px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.actions {
  display: flex;
  gap: 8px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--card-edge);
  text-align: left;
}
.table th {
  color: var(--muted);
  font-weight: 500;
}
.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
td.win { color: var(--accent); font-weight: 700; }
td.lose { color: var(--danger); font-weight: 700; }
td.draw { color: var(--gold); font-weight: 700; }
.empty {
  text-align: center;
  padding: 40px 0;
  color: var(--muted);
}
</style>
