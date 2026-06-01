<template>
  <nav v-if="navVisible" class="bottom-nav">
    <div class="nav-wrapper">
      <button
        v-for="item in menuItems"
        :key="item.name"
        @click="goTo(item.name)"
        class="nav-btn"
        :class="{ 'nav-btn-active': isActive(item.name) }"
      >
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useBottomNav } from '../composables/useBottomNav'
const { navVisible } = useBottomNav()

const route = useRoute()
const router = useRouter()

const menuItems = [
  { name: 'home', label: 'Beranda' },
  { name: 'job', label: 'Tugas' },
  { name: 'profile', label: 'Profil' }
]

const goTo = (name: string) => {
  router.push({ name })
}

const isActive = (name: string) => route.name === name
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  z-index: 50;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
}

.nav-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}

.nav-btn {
  flex: 1;
  padding: 10px 0;
  background: transparent;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #9ca3af;
}

/* Active state */
.nav-btn-active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.nav-btn-active .nav-label {
  color: white;
  font-weight: 600;
}

/* Touch feedback */
.nav-btn:active {
  transform: scale(0.96);
}

/* Responsive */
@media (min-width: 640px) {
  .bottom-nav {
    max-width: 360px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
  
  .nav-label {
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .bottom-nav {
    bottom: 8px;
    left: 8px;
    right: 8px;
  }
  
  .nav-label {
    font-size: 13px;
  }
}
</style>