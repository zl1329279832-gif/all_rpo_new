
<template>
  <div class="battle-log">
    <div class="log-header">
      <span>战斗日志</span>
      <button class="btn ghost" @click="scrolled = false" v-if="scrolled">滚动到底</button>
    </div>
    <div ref="logBody" class="log-body">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="log-entry"
        :class="`log-${entry.kind}`"
      >
        <span class="log-turn">[T{{ Math.ceil(entry.turn / 2) || 1 }}]</span>
        <span class="log-text">{{ entry.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { BattleLogEntry } from '@/types/game'

const props = defineProps<{
  entries: BattleLogEntry[]
}>()

const logBody = ref<HTMLDivElement | null>(null)
const scrolled = ref(false)

async function scrollBottom() {
  await nextTick()
  if (logBody.value) {
    logBody.value.scrollTop = logBody.value.scrollHeight
  }
}

watch(
  () => props.entries.length,
  () => {
    if (!scrolled.value) scrollBottom()
  }
)
</script>

<style scoped>
.battle-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(24, 27, 51, 0.95), rgba(10, 11, 20, 0.95));
  border: 1px solid var(--card-edge);
  overflow: hidden;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--card-edge);
  font-size: 13px;
  color: var(--muted);
  letter-spacing: 0.5px;
}
.btn.ghost {
  padding: 2px 10px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--card-edge);
}
.log-body {
  flex: 1;
  padding: 8px 10px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.55;
}
.log-entry {
  padding: 3px 6px;
  border-radius: 6px;
  margin-bottom: 2px;
}
.log-turn {
  color: var(--muted);
  margin-right: 6px;
  font-size: 11px;
}
.log-text {
  color: var(--text);
}
.log-damage {
  background: rgba(255, 107, 107, 0.08);
}
.log-damage .log-text { color: #ff9f9f; }
.log-heal {
  background: rgba(111, 243, 198, 0.08);
}
.log-heal .log-text { color: #aaf0cf; }
.log-status {
  background: rgba(122, 167, 255, 0.08);
}
.log-status .log-text { color: #a6c0ff; }
.log-turn {
  background: rgba(255, 209, 102, 0.08);
  font-weight: 600;
}
.log-turn .log-text { color: var(--gold); }
.log-system .log-text {
  color: var(--accent);
  font-weight: 600;
}
</style>
