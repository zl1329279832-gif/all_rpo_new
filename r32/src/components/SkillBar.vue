<template>
  <div class="skill-bar">
    <div
      v-for="(skill, index) in skills"
      :key="skill.id"
      class="skill-item"
      :class="{ 'on-cooldown': skill.currentCooldown > 0 }"
      @click="useSkill(skill.id)"
    >
      <div class="skill-icon">{{ skill.icon }}</div>
      <div class="skill-name">{{ skill.name }}</div>
      <div class="skill-key">{{ index + 1 }}</div>
      <div v-if="skill.currentCooldown > 0" class="skill-cooldown">
        {{ skill.currentCooldown.toFixed(1) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Skill } from '@/types/game'

defineProps<{
  skills: Skill[]
}>()

const emit = defineEmits<{
  (e: 'useSkill', id: string): void
}>()

const useSkill = (id: string) => {
  emit('useSkill', id)
}
</script>

<style scoped>
.skill-bar {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #7e57c2;
}

.skill-item {
  position: relative;
  width: 60px;
  height: 70px;
  background: #37474f;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.skill-item:hover {
  border-color: #b39ddb;
  transform: translateY(-2px);
}

.skill-item.on-cooldown {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.skill-name {
  font-size: 10px;
  color: #b0bec5;
  text-align: center;
}

.skill-key {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 11px;
  font-weight: bold;
  color: #4fc3f7;
}

.skill-cooldown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: bold;
  color: #ff5252;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
