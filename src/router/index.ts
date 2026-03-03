import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth(local)'

// Layout
import MainLayout from '../pages/layouts/MainLayout.vue'

// Pages
import login from '../pages/auth/login.vue'
import Home from '../pages/Home.vue'
import Profile from '../pages/Profile.vue'
import JobDetail from '../pages/Job/JobDetail.vue'
import FormInspection from '../pages/Inspection/FormInspection.vue'
import Job from '../pages/Job.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: login, meta: { requiresGuest: true } },
    {
      path: '/dashboard',
      component: MainLayout, // Layout wrapper
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard/home' },
        { path: 'home', name: 'home', component: Home, meta: { title: 'Home' } },
        { path: 'job', name: 'job', component: Job, meta: { title: 'Tugas' } },
        { path: 'profile', name: 'profile', component: Profile, meta: { title: 'Profile' } },
        
      ]
    },
    {
      path: '/jobs/:id', 
      name: 'JobDetail', 
      component: JobDetail, 
      meta: { title: 'Detail Tugas' },
      props: true // ✅ biar :id diteruskan sebagai prop
    },
    {
      path: '/form-inspection/:id', 
      name: 'Form', 
      component: FormInspection, 
      meta: { title: 'Form Inspection' },
      props: true // ✅ biar :id diteruskan sebagai prop
    }

  ]
})


// ⚡ Router guard: cek auth sebelum navigasi
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Cek auth
  const isAuth = await authStore.checkAuth()

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login')
  } else if (to.meta.requiresGuest && isAuth) {
    return next('/dashboard/home')
  } else {
    return next()
  }
})



export default router
