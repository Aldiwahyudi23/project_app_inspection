import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth(local)'

// Layout
import MainLayout from '../pages/layouts/MainLayout.vue'

// Pages
import Login from '../pages/auth/Login.vue'
import Home from '../pages/Home.vue'
import Profile from '../pages/Profile.vue'
import JobDetail from '../pages/Job/JobDetail.vue'
import FormInspection from '../pages/Inspection/FormInspection.vue'
import Job from '../pages/Job.vue'
import InspectionReport from '../pages/Inspection/InspectionReport.vue'
import CreateInspection from '../pages/Inspection/CreateInspection.vue'
import Settings from '../pages/Settings.vue'
import SendWhatsApp from '../pages/Inspection/SendWhatsApp.vue'
import FinancePage from '../pages/finance/FinancePage.vue'
import BankAccountsPage from '../pages/finance/BankAccountsPage.vue'
import LoginOtp from '../pages/auth/LoginOtp.vue'
import FinanceReport from '../pages/finance/FinanceReport.vue'
import PayoutDetail from '../pages/finance/PayoutDetail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login-otp' },
    { path: '/login-urgent', name: 'Login', component: Login, meta: { requiresGuest: true } },
    { path: '/login-otp', name: 'LoginOtp', component: LoginOtp, meta: { requiresGuest: true, title: 'Login OTP' } },
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
      meta: { requiresAuth: true,title: 'Detail Tugas' },
      props: true // ✅ biar :id diteruskan sebagai prop
    },
    {
      path: '/form-inspection/:id', 
      name: 'Form', 
      component: FormInspection, 
      meta: { requiresAuth: true, title: 'Form Inspection' },
      props: true // ✅ biar :id diteruskan sebagai prop
    },
    {
      path: '/report/:id', 
      name: 'Report', 
      component: InspectionReport, 
      meta: {requiresAuth: true, title: 'Report Inspection' },
      props: false
    },
    {
      path: '/created/inspection', 
      name: 'CreatedInspection', 
      component: CreateInspection, 
      meta: {requiresAuth: true, title: 'Created Inspection' },
      props: true
    },
    {
      path: '/send-whatsapp/:id', 
      name: 'SendWhatsApp', 
      component: SendWhatsApp,
      meta: { requiresAuth: true, title: 'Kirim WhatsApp' },
      props: true
    },
    {
      path: '/finance',
      name: 'Finance',
      component: FinancePage,
      meta: { requiresAuth: true, title: 'Keuangan' }
    },
    {
      path: '/bank-accounts',
      name: 'BankAccounts',
      component: BankAccountsPage,
      meta: { requiresAuth: true, title: 'Rekening Bank' }
    },
    {
      path: '/laporan',
      name: 'Laporan',
      component: FinanceReport, // Lazy load
      meta: { requiresAuth: true, title: 'Laporan' }
    },
    {
      path: '/finance/payout/:id',
      name: 'PayoutDetail',
      component: PayoutDetail, // Lazy load
      meta: { requiresAuth: true, title: 'Detail Payout' },
      props: true
    },
    { 
      path: '/settings', 
      name: 'settings', 
      component: Settings, 
      meta: { requiresAuth: true, title: 'Settings' } },

  ]
})


// ⚡ Router guard: cek auth sebelum navigasi
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Cek auth
  const isAuth = await authStore.checkAuth()

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login-otp')
  } else if (to.meta.requiresGuest && isAuth) {
    return next('/dashboard/home')
  } else {
    return next()
  }
})



export default router
