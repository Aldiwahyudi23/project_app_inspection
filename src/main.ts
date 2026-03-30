import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { useAuthStore } from './stores/auth(local)' // ← sesuai nama file kamu

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // ✅ Init auth store dulu (baca token dari storage)
  const authStore = useAuthStore()
  await authStore.initStore()

  app.use(router)
  app.mount('#app')
}

bootstrap()