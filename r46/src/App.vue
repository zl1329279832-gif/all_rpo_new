<script setup lang="ts">
import { useThemeStore } from '@/stores'
import { onMounted } from 'vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <router-view />
</template>

<style>
@import '@/styles/variables.css';
@import '@/styles/global.css';
</style>
