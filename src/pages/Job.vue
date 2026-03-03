<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <main class="flex-1 px-4 py-4 space-y-4 pb-28">
      <!-- TABS -->
      <div class="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          class="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 relative"
          :class="activeTab === tab.id
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-50'"
        >
          {{ tab.label }}
          
          <span v-if="loadingCounts && tab.id !== 'completed'" 
            class="ml-1 inline-flex items-center px-1.5 py-0.5">
            <svg class="animate-spin h-3 w-3" :class="activeTab === tab.id ? 'text-white' : 'text-gray-500'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          
          <span v-else-if="tab.count !== null" 
            class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
            :class="activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'">
            {{ tab.count }}
          </span>
          
          <span v-else class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-transparent"></span>
        </button>
      </div>

      <!-- COMPLETED FILTERS (Hanya tampil di menu Completed) -->
      <div v-if="activeTab === 'completed'" class="space-y-4">
        <!-- Year & Month Filters -->
        <div class="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="relative">
            <select 
              v-model="selectedYear" 
              @change="applyCompletedFilters"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option :value="null">Semua Tahun</option>
              <option v-for="year in availableYears" :key="year" :value="year">Tahun {{ year }}</option>
            </select>
          </div>
          <div class="relative">
            <select 
              v-model="selectedMonth" 
              @change="applyCompletedFilters"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              :disabled="!selectedYear"
            >
              <option :value="null">Semua Bulan</option>
              <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
            </select>
          </div>
        </div>

        <!-- Status Filter Pills (Hanya untuk Completed) -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">Filter Status</label>
          </div>
          
          <div class="overflow-x-auto scrollbar-hide pb-2">
            <div class="flex space-x-2 min-w-max">
              <button
                @click="selectedStatus = 'all'; applyStatusFilter()"
                class="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center space-x-2"
                :class="selectedStatus === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              >
                <span>Semua</span>
                <span class="text-xs px-1.5 py-0.5 rounded-full" 
                  :class="selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'">
                  {{ completedStatistics?.total || 0 }}
                </span>
              </button>

              <button
                v-for="status in completedAvailableStatuses"
                :key="status.value"
                @click="selectedStatus = status.value; applyStatusFilter()"
                class="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap"
                :class="selectedStatus === status.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : getStatusColorClass(status.color)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getStatusIcon(status.value)" />
                </svg>
                <span>{{ status.label }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded-full" 
                  :class="selectedStatus === status.value ? 'bg-white/20 text-white' : 'bg-white/50 text-gray-700'">
                  {{ completedStatistics?.by_status[status.value] || 0 }}
                </span>
              </button>
            </div>
          </div>
          
          <div v-if="selectedStatus && selectedStatus !== 'all'" class="mt-3 text-xs text-gray-500 flex items-center">
            <span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
            Menampilkan tugas dengan status: 
            <span class="font-medium text-blue-600 ml-1">
              {{ completedAvailableStatuses.find(s => s.value === selectedStatus)?.label }}
            </span>
            <span class="ml-2 font-medium">
              ({{ completedStatistics?.by_status[selectedStatus] || 0 }} data)
            </span>
          </div>
        </div>
      </div>
      
      <!-- NO FILTERS FOR PROCESS MENU (Bagian ini dihapus) -->
      
      <!-- SEARCH (Tampil di semua menu) -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari plat nomor, kendaraan..."
          class="w-full pl-10 pr-4 py-3 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-sm"
        />
      </div>
      
      <!-- LOADING AWAL -->
      <div v-if="initialLoading" class="flex flex-col items-center justify-center py-16">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500">Memuat data...</p>
      </div>

      <!-- JOB LIST -->
      <div v-else class="space-y-3">
        <div 
          v-for="job in displayedJobs" 
          :key="job.id" 
          @click="goToJobDetail(job.id)"
          class="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/80 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] mb-3"
        >
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center space-x-2 bg-blue-50/50 px-3 py-1.5 rounded-full">
              <span class="text-xs font-medium text-blue-600">{{ job.label.inspection_date_formatted }}</span>
            </div>
            <span class="px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm flex items-center space-x-1"
              :class="getStatusBadgeClass(job.status)">
              <svg v-if="job.status_icon" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getStatusIcon(job.status)" />
              </svg>
              <span>{{ job.status_label }}</span>
            </span>
          </div>
          <div class="mb-2">
            <div class="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-200/50">
              <div v-if="job.label.license_plate || job.label.vehicle_name">
                <p class="font-mono font-bold text-2xl text-gray-800 mt-1 tracking-wider">{{ job.label.license_plate || 'N/A' }}</p>
                <p class="font-bold text-gray-800 text-base">{{ job.label.vehicle_name || 'Kendaraan tidak tersedia' }}</p>
              </div>
              <div v-else class="text-center py-2">
                <p class="text-gray-400 text-sm">Data kendaraan sudah tidak ada</p>
              </div>
            </div>
          </div>
        </div>

        <!-- INFINITE SCROLL TRIGGER -->
        <div 
          v-if="hasMoreData" 
          ref="scrollTrigger"
          class="h-10 w-full"
        ></div>

        <!-- Loading More Indicator -->
        <div v-if="activeMenuLoading" class="flex justify-center items-center py-4">
          <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span class="ml-3 text-gray-500">Memuat data lainnya...</span>
        </div>

        <!-- No More Data -->
        <div v-if="!hasMoreData && displayedJobs.length > 0" class="text-center py-4 text-gray-400 text-sm">
          Tidak ada data lagi
        </div>

        <!-- Empty State -->
        <div v-if="displayedJobs.length === 0 && !initialLoading && !activeMenuLoading" class="flex flex-col items-center justify-center py-16 px-4">
          <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2" />
            </svg>
          </div>
          <p class="text-gray-500 text-center mb-2">Tidak ada data tugas</p>
          <p class="text-gray-400 text-sm text-center">Belum ada tugas inspeksi untuk ditampilkan</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJobs } from '../composables/useJobs';
import type { JobStatus } from '../types/job';

// Router
const router = useRouter();

// Composables
const {
  state,
  activeMenuItems,
  activeMenuPagination,
  activeMenuLoading,
  hasMoreData,
  draftCount,
  processCount,
  setActiveMenu,
  loadAllData,
  handleSearch,
  handleStatusFilter,
  handleYearMonthFilter,
  loadMore
} = useJobs();

// Local state
const searchQuery = ref('');
const selectedYear = ref<number | null>(null);
const selectedMonth = ref<number | null>(null);
const selectedStatus = ref<'all' | JobStatus>('all');
const scrollTrigger = ref<HTMLElement | null>(null);

// Constants
const tabs = computed(() => [
  { id: 'draft' as const, label: 'Draft', count: draftCount.value },
  { id: 'process' as const, label: 'Proses', count: processCount.value },
  { id: 'completed' as const, label: 'Selesai', count: null }
]);

const months = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

// Computed
const activeTab = computed({
  get: () => state.activeMenu,
  set: (value) => setActiveMenu(value)
});

const loadingCounts = computed(() => state.loading.counts);
const initialLoading = computed(() => state.loading.initial);

const displayedJobs = computed(() => {
  return activeMenuItems.value;
});

const completedStatistics = computed(() => state.completed.statistics);
const completedAvailableStatuses = computed(() => state.completed.availableStatuses);

const availableYears = computed(() => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    years.push(currentYear - i);
  }
  return years;
});

// Methods
const switchTab = (tab: 'draft' | 'process' | 'completed') => {
  setActiveMenu(tab);
  
  // Reset filters when switching tabs
  if (tab !== 'completed') {
    selectedYear.value = null;
    selectedMonth.value = null;
    selectedStatus.value = 'all';
    
    // Reset completed status filter di composables
    handleStatusFilter(null);
  }
  
  // Clear search
  searchQuery.value = '';
};

const applyCompletedFilters = () => {
  handleYearMonthFilter(selectedYear.value, selectedMonth.value);
};

const applyStatusFilter = () => {
  if (selectedStatus.value === 'all') {
    handleStatusFilter(null);
  } else {
    handleStatusFilter(selectedStatus.value);
  }
};

const goToJobDetail = (uuid: number) => {
  router.push(`/jobs/${uuid}`);
};

const getStatusBadgeClass = (status: JobStatus) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-700 border border-gray-200',
    process: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    approved: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
    completed: 'bg-blue-100 text-blue-700 border border-blue-200',
    cancelled: 'bg-gray-100 text-gray-700 border border-gray-200'
  };
  return classes[status] || classes.draft;
};

const getStatusColorClass = (color: string) => {
  const classes = {
    gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-green-100 text-green-700 hover:bg-green-200',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
    warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    info: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
  };
  return classes[color as keyof typeof classes] || classes.gray;
};

const getStatusIcon = (status: JobStatus) => {
  const icons = {
    draft: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    process: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    approved: 'M5 13l4 4L19 7',
    rejected: 'M6 18L18 6M6 6l12 12',
    completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    cancelled: 'M6 18L18 6M6 6l12 12'
  };
  return icons[status] || icons.draft;
};

// Intersection Observer
let observer: IntersectionObserver | null = null;

const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMoreData.value && !activeMenuLoading.value) {
        loadMore();
      }
    },
    { threshold: 0.1, rootMargin: '100px' }
  );

  if (scrollTrigger.value) {
    observer.observe(scrollTrigger.value);
  }
};

// Watchers
watch(searchQuery, (value) => {
  handleSearch(value);
});

watch(activeTab, () => {
  // Reset scroll trigger when tab changes
  setTimeout(() => {
    if (scrollTrigger.value && observer) {
      observer.unobserve(scrollTrigger.value);
      observer.observe(scrollTrigger.value);
    }
  }, 100);
});

watch(scrollTrigger, (newVal) => {
  if (newVal) {
    setupIntersectionObserver();
  }
});

// Lifecycle
onMounted(async () => {
  await loadAllData();
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Pull to refresh effect (optional) */
.pull-to-refresh {
  transform: translateY(0);
  transition: transform 0.3s ease;
}
</style>