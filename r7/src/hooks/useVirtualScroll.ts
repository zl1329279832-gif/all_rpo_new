import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'

interface VirtualScrollOptions {
  itemHeight: number
  bufferCount?: number
}

interface VirtualScrollResult {
  visibleItems: Ref<any[]>
  containerStyle: Ref<{ height: string; overflow: string }>
  innerStyle: Ref<{ height: string; paddingTop: string }>
  scrollToIndex: (index: number) => void
  scrollToBottom: () => void
}

export function useVirtualScroll(
  items: Ref<any[]>,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, bufferCount = 3 } = options
  
  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)
  
  const visibleItems = ref<any[]>([])
  
  const totalHeight = computed(() => items.value.length * itemHeight)
  
  const startIndex = computed(() => {
    const idx = Math.floor(scrollTop.value / itemHeight)
    return Math.max(0, idx - bufferCount)
  })
  
  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight.value / itemHeight) + bufferCount * 2
    return Math.min(items.value.length, startIndex.value + visibleCount)
  })
  
  const containerStyle = computed(() => ({
    height: '100%',
    overflow: 'auto' as const
  }))
  
  const innerStyle = computed(() => ({
    height: `${totalHeight.value}px`,
    paddingTop: `${startIndex.value * itemHeight}px`
  }))
  
  const updateVisibleItems = () => {
    visibleItems.value = items.value.slice(startIndex.value, endIndex.value)
  }
  
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrollTop.value = target.scrollTop
    updateVisibleItems()
  }
  
  const scrollToIndex = (index: number) => {
    if (containerRef.value) {
      containerRef.value.scrollTop = index * itemHeight
    }
  }
  
  const scrollToBottom = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }
  
  const updateContainerHeight = () => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
      updateVisibleItems()
    }
  }
  
  watch(
    () => items.value.length,
    () => {
      updateVisibleItems()
    },
    { immediate: true }
  )
  
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', updateContainerHeight)
      updateContainerHeight()
    }
  })
  
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
    window.removeEventListener('resize', updateContainerHeight)
  })
  
  return {
    visibleItems,
    containerStyle,
    innerStyle,
    scrollToIndex,
    scrollToBottom
  }
}
