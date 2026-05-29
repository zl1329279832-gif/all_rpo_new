<template>
  <AppLayout v-if="!isEmptyLayout" />
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { initTheme } = useTheme()

const isEmptyLayout = computed(() => route.meta.layout === 'empty')

onMounted(() => {
  initTheme()
})
</script>
