// composables/useJobs.ts
import { reactive, computed, watch } from 'vue';
import jobService from '../services/jobService';
import type { 
  JobState, 
  JobMenu, 
  JobItem, 
  PaginatedData,
  JobQueryParams,
  JobStatus,
} from '../types/job';

export function useJobs() {
  // State
  const state = reactive<JobState>({
    counts: null,
    draft: {
      data: null,
      loading: false,
      search: '',
      params: {
        sort_field: 'inspection_date',
        sort_order: 'asc',
        per_page: 10,
        page: 1
      }
    },
    process: {
      data: null,
      loading: false,
      search: '',
      params: {
        sort_field: 'inspection_date',
        sort_order: 'asc',
        per_page: 10,
        page: 1
      },
      availableStatuses: []
    },
    completed: {
      data: null,
      loading: false,
      search: '',
      params: {
        sort_field: 'inspection_date',
        sort_order: 'desc',
        per_page: 10,
        page: 1
      },
      availableStatuses: [],
      availableMonths: [],
      year: null,
      month: null,
      selectedStatus: null,
      statistics: null
    },
    activeMenu: 'process',
    loading: {
      counts: false,
      initial: false
    }
  });

  // Search debounce timer
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed
  const activeMenuData = computed(() => {
    switch (state.activeMenu) {
      case 'draft':
        return state.draft;
      case 'process':
        return state.process;
      case 'completed':
        return state.completed;
      default:
        return state.draft;
    }
  });

  const activeMenuItems = computed(() => {
    return activeMenuData.value.data?.items || [];
  });

  const activeMenuPagination = computed(() => {
    return activeMenuData.value.data?.pagination;
  });

  const activeMenuLoading = computed(() => {
    return activeMenuData.value.loading;
  });

  const hasMoreData = computed(() => {
    const pagination = activeMenuPagination.value;
    if (!pagination) return false;
    return pagination.current_page < pagination.last_page;
  });

  const draftCount = computed(() => state.counts?.draft || 0);
  const processCount = computed(() => state.counts?.process || 0);

  // Methods
  const setActiveMenu = (menu: JobMenu) => {
    state.activeMenu = menu;
  };

  const loadCounts = async () => {
    state.loading.counts = true;
    try {
      const response = await jobService.getJobCounts();
      if (response.status === 'success') {
        state.counts = response.data;
      }
    } catch (error) {
      console.error('Failed to load job counts:', error);
    } finally {
      state.loading.counts = false;
    }
  };

  const loadDraftJobs = async (append = false) => {
    if (state.draft.loading) return;
    
    state.draft.loading = true;
    try {
      const params = { ...state.draft.params };
      if (state.draft.search) {
        params.search = state.draft.search;
      }
      
      const response = await jobService.getDraftJobs(params);
      
      if (response.status === 'success') {
        const paginatedData: PaginatedData<JobItem> = {
          items: response.data,
          pagination: response.pagination
        };
        
        if (append && state.draft.data) {
          state.draft.data = {
            items: [...state.draft.data.items, ...response.data],
            pagination: response.pagination
          };
        } else {
          state.draft.data = paginatedData;
        }
      }
    } catch (error) {
      console.error('Failed to load draft jobs:', error);
    } finally {
      state.draft.loading = false;
    }
  };

  const loadProcessJobs = async (append = false) => {
    if (state.process.loading) return;
    
    state.process.loading = true;
    try {
      const params = { ...state.process.params };
      if (state.process.search) {
        params.search = state.process.search;
      }
      
      const response = await jobService.getProcessJobs(params);
      
      if (response.status === 'success') {
        const paginatedData: PaginatedData<JobItem> = {
          items: response.data,
          pagination: response.pagination
        };
        
        if (append && state.process.data) {
          state.process.data = {
            items: [...state.process.data.items, ...response.data],
            pagination: response.pagination
          };
        } else {
          state.process.data = paginatedData;
        }
        
        if (response.filters?.available_statuses) {
          state.process.availableStatuses = response.filters.available_statuses;
        }
      }
    } catch (error) {
      console.error('Failed to load process jobs:', error);
    } finally {
      state.process.loading = false;
    }
  };

  const loadCompletedJobs = async (append = false) => {
    if (state.completed.loading) return;
    
    state.completed.loading = true;
    try {
      const params: JobQueryParams = {
        ...state.completed.params,
        search: state.completed.search || undefined,
        year: state.completed.year || undefined,
        month: state.completed.month || undefined,
        status: state.completed.selectedStatus || undefined
      };
      
      const response = await jobService.getCompletedJobs(params);
      
      if (response.status === 'success') {
        const paginatedData: PaginatedData<JobItem> = {
          items: response.data,
          pagination: response.pagination,
          filters: response.filters,
          statistics: response.statistics
        };
        
        if (append && state.completed.data) {
          state.completed.data = {
            items: [...state.completed.data.items, ...response.data],
            pagination: response.pagination,
            filters: response.filters,
            statistics: response.statistics
          };
        } else {
          state.completed.data = paginatedData;
        }
        
        if (response.filters) {
          state.completed.availableStatuses = response.filters.available_statuses;
          state.completed.availableMonths = response.filters.available_months;
        }
        
        if (response.statistics) {
          state.completed.statistics = response.statistics;
        }
      }
    } catch (error) {
      console.error('Failed to load completed jobs:', error);
    } finally {
      state.completed.loading = false;
    }
  };

  const loadAllData = async () => {
    state.loading.initial = true;
    try {
      await Promise.all([
        loadCounts(),
        loadDraftJobs(),
        loadProcessJobs(),
        loadCompletedJobs()
      ]);
    } catch (error) {
      console.error('Failed to load all data:', error);
    } finally {
      state.loading.initial = false;
    }
  };

  const handleSearch = (search: string) => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    searchTimer = setTimeout(() => {
      const menu = state.activeMenu;
      
      switch (menu) {
        case 'draft':
          state.draft.search = search;
          state.draft.params.page = 1;
          loadDraftJobs(false);
          break;
        case 'process':
          state.process.search = search;
          state.process.params.page = 1;
          loadProcessJobs(false);
          break;
        case 'completed':
          state.completed.search = search;
          state.completed.params.page = 1;
          loadCompletedJobs(false);
          break;
      }
    }, 500);
  };

  const handleStatusFilter = (status: JobStatus | null) => {
    if (state.activeMenu === 'process') {
      state.process.params.status = status || undefined;
      state.process.params.page = 1;
      loadProcessJobs(false);
    } else if (state.activeMenu === 'completed') {
      state.completed.selectedStatus = status;
      state.completed.params.status = status || undefined;
      state.completed.params.page = 1;
      loadCompletedJobs(false);
    }
  };

  const handleYearMonthFilter = (year: number | null, month: number | null) => {
    if (state.activeMenu === 'completed') {
      state.completed.year = year;
      state.completed.month = month;
      state.completed.params.year = year || undefined;
      state.completed.params.month = month || undefined;
      state.completed.params.page = 1;
      loadCompletedJobs(false);
    }
  };

  const loadMore = () => {
    if (!hasMoreData.value || activeMenuLoading.value) return;
    
    const menu = state.activeMenu;
    
    switch (menu) {
      case 'draft':
        state.draft.params.page = (state.draft.params.page || 1) + 1;
        loadDraftJobs(true);
        break;
      case 'process':
        state.process.params.page = (state.process.params.page || 1) + 1;
        loadProcessJobs(true);
        break;
      case 'completed':
        state.completed.params.page = (state.completed.params.page || 1) + 1;
        loadCompletedJobs(true);
        break;
    }
  };

  // Watch for menu changes to ensure data is loaded
  watch(() => state.activeMenu, (newMenu) => {
    const menuData = newMenu === 'draft' ? state.draft :
                    newMenu === 'process' ? state.process :
                    state.completed;
    
    // Load data if not loaded yet
    if (!menuData.data && !menuData.loading) {
      switch (newMenu) {
        case 'draft':
          loadDraftJobs(false);
          break;
        case 'process':
          loadProcessJobs(false);
          break;
        case 'completed':
          loadCompletedJobs(false);
          break;
      }
    }
  });

  return {
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
  };
}