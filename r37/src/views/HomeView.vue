
<template>
  <div class="home-view">
    <div class="hero">
      <h1 class="title">幻境对决</h1>
      <p class="subtitle">回合制卡牌对战原型 · R37</p>
    </div>

    <div class="panel config">
      <h2>对战设置</h2>
      <div class="row">
        <label>你的名字</label>
        <input v-model="form.playerName" maxlength="12" />
      </div>
      <div class="row">
        <label>对手名字</label>
        <input v-model="form.enemyName" maxlength="12" />
      </div>
      <div class="row">
        <label>对战模式</label>
        <select v-model="form.enemyIsAI">
          <option :value="true">本地对战 AI</option>
          <option :value="false">本地双人（轮流）</option>
        </select>
      </div>
      <div class="row">
        <label>你的卡组</label>
        <select v-model="form.playerDeckKey">
          <option v-for="p in decks" :key="p.key" :value="p.key">{{ p.name }} — {{ p.description }}</option>
        </select>
      </div>
      <div class="row">
        <label>对手卡组</label>
        <select v-model="form.enemyDeckKey">
          <option v-for="p in decks" :key="p.key" :value="p.key">{{ p.name }} — {{ p.description }}</option>
        </select>
      </div>
      <div class="row">
        <label>起始生命</label>
        <input type="number" v-model.number="form.startHp" min="20" max="999" />
      </div>
      <div class="row">
        <label>起始能量</label>
        <input type="number" v-model.number="form.startEnergy" min="1" max="10" />
      </div>
      <div class="row">
        <label>最大能量</label>
        <input type="number" v-model.number="form.maxEnergy" min="1" max="15" />
      </div>
      <div class="row">
        <label>每回合抽牌</label>
        <input type="number" v-model.number="form.drawPerTurn" min="1" max="10" />
      </div>
      <div class="row">
        <label>起始手牌</label>
        <input type="number" v-model.number="form.startingHand" min="1" max="10" />
      </div>
      <div class="row">
        <label>音效</label>
        <select v-model="soundOn">
          <option :value="true">开启</option>
          <option :value="false">关闭</option>
        </select>
      </div>
      <div class="actions">
        <button class="btn primary" @click="start">开始对战</button>
        <router-link class="btn" to="/records">战绩</router-link>
      </div>
    </div>

    <div class="panel tips">
      <h3>玩法提示</h3>
      <ul>
        <li>每回合自动抽牌、恢复能量，并结算持续效果（中毒、再生等）。</li>
        <li>点击手牌或拖放到对手面板上即可出牌；护盾会在回合结束时消失。</li>
        <li>攻击会考虑力量与虚弱；受到攻击时若拥有荆棘，会对攻击者反弹伤害。</li>
        <li>控制牌（如眩晕）可以阻断对手下一回合的出牌。</li>
        <li>所有对局结果会自动保存到本地战绩中。</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DECK_PRESETS } from '@/data/decks'
import { useBattleStore } from '@/stores/battle'
import { sfx } from '@/composables/sfx'
import type { BattleConfig } from '@/types/game'

const router = useRouter()
const store = useBattleStore()

const decks = Object.values(DECK_PRESETS)

const form = reactive<BattleConfig>({
  playerName: '玩家',
  enemyName: 'AI 对手',
  enemyIsAI: true,
  playerDeckKey: 'balanced',
  enemyDeckKey: 'aggro',
  startHp: 60,
  startEnergy: 3,
  maxEnergy: 10,
  drawPerTurn: 1,
  startingHand: 4
})

const soundOn = ref(sfx.isEnabled())
function onSoundChange(v: boolean) {
  sfx.setEnabled(v)
}
// keep ref bound
void onSoundChange

function start() {
  store.reset()
  store.start({ ...form })
  router.push({ name: 'Battle' })
}
</script>

<style scoped>
.home-view {
  min-height: 100%;
  padding: 40px 20px;
  display: grid;
  gap: 24px;
  justify-items: center;
  background:
    radial-gradient(circle at 30% 10%, rgba(122, 167, 255, 0.15), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(111, 243, 198, 0.1), transparent 50%),
    linear-gradient(180deg, #0a0b14 0%, #0c0f22 100%);
}
.hero {
  text-align: center;
  padding: 20px 10px;
}
.title {
  margin: 0;
  font-size: 48px;
  letter-spacing: 6px;
  background: linear-gradient(90deg, #6ff3c6, #7aa7ff, #ffd166);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 24px rgba(122, 167, 255, 0.25);
}
.subtitle {
  margin: 8px 0 0;
  color: var(--muted);
  letter-spacing: 2px;
}
.panel {
  width: min(720px, 100%);
  padding: 22px 24px;
}
.panel h2,
.panel h3 {
  margin-top: 0;
}
.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.row label {
  color: var(--muted);
  font-size: 13px;
}
input,
select {
  width: 100%;
  padding: 8px 10px;
  background: #0f132a;
  color: var(--text);
  border: 1px solid var(--card-edge);
  border-radius: 8px;
  font-family: inherit;
}
input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}
.tips ul {
  padding-left: 20px;
  color: var(--muted);
  line-height: 1.8;
}
</style>
