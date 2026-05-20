import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useFpsMonitor(enabled: boolean = true) {
  const fps = ref(0)
  const frameCount = ref(0)
  const lastUpdate = ref(performance.now())
  let animationId: number | null = null

  const update = () => {
    frameCount.value++
    const now = performance.now()
    
    if (now - lastUpdate.value >= 1000) {
      fps.value = frameCount.value
      frameCount.value = 0
      lastUpdate.value = now
    }
    
    animationId = requestAnimationFrame(update)
  }

  const start = () => {
    if (!enabled || animationId !== null) return
    lastUpdate.value = performance.now()
    animationId = requestAnimationFrame(update)
  }

  const stop = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  onMounted(() => {
    if (enabled) start()
  })

  onBeforeUnmount(() => {
    stop()
  })

  return {
    fps,
    start,
    stop
  }
}
