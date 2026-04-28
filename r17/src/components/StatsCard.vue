<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  icon: string;
  title: string;
  value: number | string;
  unit?: string;
  color?: 'primary' | 'electricity' | 'water' | 'carbon' | 'people';
}>();

const colorClass = computed(() => {
  const colors = {
    primary: 'color-primary',
    electricity: 'color-electricity',
    water: 'color-water',
    carbon: 'color-carbon',
    people: 'color-people'
  };
  return colors[props.color || 'primary'];
});
</script>

<template>
  <div class="stats-card" :class="colorClass">
    <div class="card-icon">{{ icon }}</div>
    <div class="card-content">
      <div class="card-value">
        {{ typeof value === 'number' ? value.toLocaleString() : value }}
        <span v-if="unit" class="card-unit">{{ unit }}</span>
      </div>
      <div class="card-title">{{ title }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  background: rgba(51, 65, 85, 0.9);
}

.card-icon {
  font-size: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.card-unit {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 4px;
}

.card-title {
  font-size: 11px;
  color: #94a3b8;
}

.color-primary .card-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
}

.color-electricity .card-icon {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.2));
}

.color-water .card-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
}

.color-carbon .card-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 197, 94, 0.2));
}

.color-people .card-icon {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2));
}
</style>
