<!-- components/inspection/inputs/FileInput.vue -->
<template>
  <div class="space-y-3">
    <!-- File list -->
    <div v-if="files.length > 0" class="space-y-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-gray-700">{{ file.name || 'File' }}</p>
            <p v-if="file.size" class="text-xs text-gray-500">{{ formatFileSize(file.size / 1024) }}</p>
          </div>
        </div>
        <button
          @click="removeFile(Number(index))"
          class="p-1 hover:bg-gray-200 rounded-full"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Upload button -->
    <div
      v-if="!isMaxFilesReached"
      class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
      @click="triggerFileInput"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="allowedMimesString"
        :multiple="(settings.max_files ?? 1) > 1"
        @change="handleFileSelect"
        class="hidden"
      />
      
      <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      
      <p class="text-sm text-gray-600">
        Klik atau drag untuk upload file
      </p>
      <p class="text-xs text-gray-400 mt-1">
        {{ (settings.max_files ?? 1) > 1 ? `Maksimal ${settings.max_files} file` : 'Maksimal 1 file' }}
        • {{ formatFileSize(settings.max_size || 2048) }}
      </p>
    </div>
    
    <!-- Option select if available -->
    <div v-if="settings.show_option && options.length > 0" class="mt-3">
      <select
        v-model="selectedOption"
        @change="handleOptionChange"
        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
      >
        <option value="">Pilih opsi (opsional)</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
    
    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  modelValue: any
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'update:error', error: string): void
}>()

const settings = computed(() => props.item.settings)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedOption = ref('')

const files = computed(() => {
  return props.modelValue || []
})

const options = computed(() => {
  return settings.value?.options || []
})

const allowedMimesString = computed(() => {
  const mimes = settings.value?.allowed_mimes || ['pdf', 'doc', 'docx']
  return mimes.map(m => m.startsWith('.') ? m : `.${m}`).join(',')
})

const isMaxFilesReached = computed(() => {
  const max = settings.value?.max_files || 1
  return files.value.length >= max
})

const formatFileSize = (kb: number) => {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files) processFiles(Array.from(files))
}

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) processFiles(Array.from(files))
}

const processFiles = (newFiles: File[]) => {
  const maxFiles = settings.value?.max_files || 1
  const maxSize = (settings.value?.max_size || 2048) * 1024
  const allowedMimes = settings.value?.allowed_mimes || ['pdf', 'doc', 'docx']
  
  // Check max files
  if (files.value.length + newFiles.length > maxFiles) {
    emit('update:error', `Maksimal ${maxFiles} file`)
    return
  }
  
  // Process each file
  newFiles.forEach(file => {
    // Check file type
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!allowedMimes.includes(ext || '')) {
      emit('update:error', `Tipe file tidak diizinkan`)
      return
    }
    
    // Check file size
    if (file.size > maxSize) {
      emit('update:error', `Ukuran file maksimal ${formatFileSize(maxSize / 1024)}`)
      return
    }
    
    // Emit file
    const currentFiles = [...files.value, file]
    emit('update:modelValue', currentFiles)
  })
}

const removeFile = (index: number) => {
  const currentFiles = [...files.value]
  currentFiles.splice(index, 1)
  emit('update:modelValue', currentFiles)
}

const handleOptionChange = () => {
  // Option handling logic
}
</script>