import { ref } from 'vue'

const navVisible = ref(true)

export function useBottomNav() {
  const hideNav = () => { navVisible.value = false }
  const showNav = () => { navVisible.value = true  }
  return { navVisible, hideNav, showNav }
}