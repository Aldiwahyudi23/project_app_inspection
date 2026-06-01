// src/stores/useModalStore.ts
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', {
  state: () => ({
    stack: [] as string[],
  }),

  getters: {
    hasModal: (state) => state.stack.length > 0,
    currentModal: (state) => state.stack[state.stack.length - 1] || null,
  },

  actions: {
    open(name: string) {
      // ✅ Cegah duplikat
      if (this.stack.includes(name)) return
      this.stack.push(name)
    },

    close() {
      if (this.stack.length > 0) {
        this.stack.pop()
      }
    },
    
    isOpen(name: string) {
      return this.stack.includes(name)
    },

    removeByKey(name: string) {
      this.stack = this.stack.filter(k => k !== name)
    },

    closeAll() {
      this.stack = []
    },
  },
})