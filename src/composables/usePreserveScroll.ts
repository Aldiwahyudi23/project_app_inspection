// composables/usePreserveScroll.ts
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export function usePreserveScroll(options?: {
  elementId?: string
  scrollDelay?: number
}) {
  const scrollPosition = ref(0)
  const element = options?.elementId 
    ? document.getElementById(options.elementId) 
    : window
  
  const saveScroll = () => {
    try {
      if (element === window) {
        scrollPosition.value = window.scrollY
      } else if (element) {
        scrollPosition.value = (element as HTMLElement).scrollTop
      }
    } catch (e) {
      console.warn('Failed to save scroll position:', e)
    }
  }
  
  const restoreScroll = () => {
    nextTick(() => {
      try {
        const delay = options?.scrollDelay ?? 50
        
        setTimeout(() => {
          if (element === window) {
            window.scrollTo({
              top: scrollPosition.value,
              behavior: 'auto' // Gunakan 'auto' bukan 'smooth' untuk menghindari lag
            })
          } else if (element) {
            (element as HTMLElement).scrollTop = scrollPosition.value
          }
        }, delay)
      } catch (e) {
        console.warn('Failed to restore scroll position:', e)
      }
    })
  }
  
  // Auto restore on mount
  onMounted(() => {
    restoreScroll()
  })
  
  // Auto save on unmount
  onUnmounted(() => {
    saveScroll()
  })
  
  return {
    saveScroll,
    restoreScroll,
    scrollPosition
  }
}