import { ref, watch, nextTick, type Ref } from 'vue'

interface AutoScrollOptions {
  threshold?: number
  smooth?: boolean
}

interface AutoScrollResult {
  shouldScroll: Ref<boolean>
  scrollToBottom: () => void
  checkScrollPosition: () => void
}

export function useAutoScroll(
  containerRef: Ref<HTMLElement | null>,
  options: AutoScrollOptions = {}
): AutoScrollResult {
  const { threshold = 50, smooth = true } = options
  
  const shouldScroll = ref(true)
  const lastScrollHeight = ref(0)
  
  const scrollToBottom = () => {
    if (containerRef.value) {
      const scrollHeight = containerRef.value.scrollHeight
      containerRef.value.scrollTo({
        top: scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
      lastScrollHeight.value = scrollHeight
    }
  }
  
  const checkScrollPosition = () => {
    if (!containerRef.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    shouldScroll.value = distanceFromBottom <= threshold
  }
  
  const handleScroll = () => {
    checkScrollPosition()
  }
  
  const observeContentChanges = () => {
    if (!containerRef.value) return
    
    const observer = new MutationObserver(() => {
      nextTick(() => {
        if (shouldScroll.value) {
          scrollToBottom()
        }
      })
    })
    
    observer.observe(containerRef.value, {
      childList: true,
      subtree: true,
      characterData: true
    })
    
    return observer
  }
  
  watch(
    () => containerRef.value,
    (newContainer) => {
      if (newContainer) {
        newContainer.addEventListener('scroll', handleScroll)
        const observer = observeContentChanges()
        
        return () => {
          newContainer.removeEventListener('scroll', handleScroll)
          observer?.disconnect()
        }
      }
    },
    { immediate: true }
  )
  
  return {
    shouldScroll,
    scrollToBottom,
    checkScrollPosition
  }
}
