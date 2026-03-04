<!-- components/inspection/inputs/TextareaInput.vue -->
<template>
  <div class="space-y-2">

    <!-- ============================= -->
    <!-- DAMAGE OPTIONS (DI ATAS) -->
    <!-- ============================= -->
    <div v-if="settings.show_damage && damageList.length" class="space-y-2">

      <div class="text-sm font-semibold text-gray-600">
        Pilih Jenis Kerusakan:
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="damage in damageList"
          :key="damage.id"
          @click="toggleDamage(damage)"
          class="px-3 py-1.5 rounded-full border text-sm cursor-pointer transition"
          :class="selectedDamageIds.includes(Number(damage.id))
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white border-gray-300 hover:border-blue-400'"
        >
          {{ damage.label }}
        </div>
      </div>

    </div>

    <!-- ============================= -->
    <!-- RICH TEXT MODE -->
    <!-- ============================= -->
    <div v-if="settings.rich_text">

      <!-- Toolbar -->
      <div class="flex flex-wrap gap-2 border rounded-lg p-2 bg-gray-50">
        <button type="button" @click="format('bold')" :class="toolbarClass('bold')"><b>B</b></button>
        <button type="button" @click="format('italic')" :class="toolbarClass('italic')"><i>I</i></button>
        <button type="button" @click="format('insertUnorderedList')" :class="toolbarClass('insertUnorderedList')">•</button>
        <button type="button" @click="format('insertOrderedList')" :class="toolbarClass('insertOrderedList')">1.</button>
      </div>

      <!-- Editor -->
      <div
        ref="editor"
        contenteditable="true"
        @input="handleRichInput"
        @blur="validate"
        @keyup="updateToolbarState"
        @mouseup="updateToolbarState"
        @keydown="handleRichKeydown"
        class="w-full min-h-[120px] px-4 py-2.5 border rounded-lg outline-none transition-colors"
        :class="error
          ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-400'
          : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-400'"
      ></div>

      <div v-if="settings.rich_text" class="text-xs text-blue-500 flex items-center">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        Mendukung format teks kaya
      </div>
    </div>

    <!-- ============================= -->
    <!-- NORMAL TEXTAREA -->
    <!-- ============================= -->
    <textarea
      v-else
      :value="modelValue"
      @input="handleNormalInput"
      @keydown="handleNormalKeydown"
      @blur="validate"
      :rows="settings.rows || 4"
      :maxlength="settings.max_length"
      :minlength="settings.min_length"
      :placeholder="settings.placeholder || `Masukkan ${item.inspection_item.name}`"
      :class="[
        'w-full px-4 py-2.5 border rounded-lg outline-none transition-colors resize-none',
        error
          ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-400'
          : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-400'
      ]"
    ></textarea>

    <!-- ============================= -->
    <!-- CHARACTER COUNTER -->
    <!-- ============================= -->
    <div v-if="settings.max_length" class="text-xs text-gray-400 text-right">
      {{ plainTextLength }} / {{ settings.max_length }}
    </div>

    <!-- ============================= -->
    <!-- ERROR MESSAGE -->
    <!-- ============================= -->
    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  modelValue: string
  error?: string
  /**
   * Dikirim dari OptionRenderer — berisi damage IDs yang aktif
   * setelah difilter sesuai option yang masih terpilih.
   * Digunakan untuk sinkronisasi UI pill damage dari luar.
   */
  activeDamageIds?: number[] | null
}>()

const emit = defineEmits([
  'update:modelValue',
  'update:error',
  'update:damageIds'
])

const settings  = computed(() => props.item.settings || {})
const editor    = ref<HTMLElement | null>(null)
const activeFormats        = ref<Record<string, boolean>>({})
const lastValueWasFromDamage = ref(false)

/* ===========================
   DAMAGE DATA SOURCE
=========================== */
// const damageList = computed(() => settings.value.damage_ids || [])
const damageList = computed(() => (settings.value.damage_ids || []) as Array<{ id: number | string; label: string; value: string }>)
/* ===========================
   selectedDamageIds — STATE LOKAL
   Sumber kebenaran UI pill damage.
   Bisa di-update dari 3 sumber:
   1. User klik pill (toggleDamage)
   2. Sync dari modelValue (syncDamageFromText)
   3. Sync dari activeDamageIds prop (dari OptionRenderer, saat option di-unselect)
=========================== */
const selectedDamageIds = ref<number[]>([])

/* ===========================
   WATCH activeDamageIds dari luar
   Ketika OptionRenderer mem-filter damage yang sudah tidak valid
   (karena option di-unselect), kita update selectedDamageIds lokal.
=========================== */
watch(
  () => props.activeDamageIds,
  (newIds) => {
    if (!newIds) return

    const newIdsNormalized = newIds.map(Number)

    // Cek apakah ada perbedaan sebelum update untuk hindari loop
    const current = [...selectedDamageIds.value].sort().join(',')
    const incoming = [...newIdsNormalized].sort().join(',')

    if (current !== incoming) {
      selectedDamageIds.value = newIdsNormalized
      // Tidak perlu emit update:damageIds di sini karena
      // OptionRenderer sudah emit ke parent saat filter
    }
  },
  { immediate: true }
)

/* ===========================
   PLAIN TEXT LENGTH
=========================== */
const plainTextLength = computed(() => {
  if (!settings.value.rich_text) return (props.modelValue || '').length
  const div = document.createElement('div')
  div.innerHTML = props.modelValue || ''
  return div.innerText.length
})

/* ===========================
   PLAIN TEXT EXTRACTION
=========================== */
const getPlainText = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.innerText
}

/* ===========================
   NORMALIZE FUNCTIONS
=========================== */
const normalizeTextToArray = (text: string): string[] => {
  return text
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

const joinArrayToText = (arr: string[]): string => {
  return arr.join(', ')
}

/* ===========================
   SYNC DAMAGE FROM TEXT
   Hanya dipakai untuk sync dari modelValue (user ketik manual).
   Tidak override activeDamageIds dari luar.
=========================== */
const syncDamageFromText = (text: string) => {
  const plainText  = settings.value.rich_text ? getPlainText(text) : text
  const textArray  = normalizeTextToArray(plainText)

  const newSelectedIds = damageList.value
    .filter(damage => textArray.includes(damage.value.trim()))
    .map(damage => Number(damage.id))

  // Jika activeDamageIds dikirim dari luar, gunakan intersection:
  // hanya aktifkan damage yang ada di teks DAN masih valid menurut parent
  if (props.activeDamageIds !== undefined && props.activeDamageIds !== null) {
    const validIds = props.activeDamageIds.map(Number)
    selectedDamageIds.value = newSelectedIds.filter(id => validIds.includes(id))
  } else {
    selectedDamageIds.value = newSelectedIds
  }

  emit('update:damageIds', selectedDamageIds.value)
}

/* ===========================
   WATCH MODEL VALUE FOR SYNC
=========================== */
watch(() => props.modelValue, (newVal) => {
  syncDamageFromText(newVal || '')

  if (settings.value.rich_text && editor.value && document.activeElement !== editor.value) {
    editor.value.innerHTML = newVal || ''
  }
}, { immediate: true })

/* ===========================
   NORMAL INPUT HANDLER
=========================== */
const handleNormalInput = (e: Event) => {
  let value = (e.target as HTMLTextAreaElement).value

  const arr = normalizeTextToArray(value)
  value = joinArrayToText(arr)

  emit('update:modelValue', value)
  validateField(value)
}

const handleNormalKeydown = (e: KeyboardEvent) => {
  if (!lastValueWasFromDamage.value) return

  const textarea = e.target as HTMLTextAreaElement
  const value    = textarea.value

  if (value.trim().endsWith(',')) {
    lastValueWasFromDamage.value = false
    return
  }

  if (e.key.length === 1) {
    e.preventDefault()
    const newValue = value.trimEnd() + ', ' + e.key
    emit('update:modelValue', newValue)
    lastValueWasFromDamage.value = false
  }
}

/* ===========================
   RICH TEXT HANDLERS
=========================== */
const handleRichInput = () => {
  if (!editor.value) return

  let html = editor.value.innerHTML
  if (!settings.value.allow_html) {
    html = editor.value.innerText
  }

  emit('update:modelValue', html)
  validateField(html)
}

const handleRichKeydown = (e: KeyboardEvent) => {
  if (!lastValueWasFromDamage.value || !editor.value) return

  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return

  const range       = selection.getRangeAt(0)
  const textContent = editor.value.innerText

  const isAtEnd =
    range.endOffset === textContent.length &&
    range.endContainer === editor.value.lastChild

  if (!isAtEnd) return

  if (textContent.trim().endsWith(',')) {
    lastValueWasFromDamage.value = false
    return
  }

  if (e.key.length === 1) {
    e.preventDefault()
    document.execCommand('insertText', false, ', ' + e.key)
    lastValueWasFromDamage.value = false
  }
}

/* ===========================
   RICH TEXT FORMAT
=========================== */
const format = (command: string) => {
  document.execCommand(command)
  updateToolbarState()
}

const updateToolbarState = () => {
  activeFormats.value = {
    bold:                document.queryCommandState('bold'),
    italic:              document.queryCommandState('italic'),
    insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    insertOrderedList:   document.queryCommandState('insertOrderedList'),
  }
}

const toolbarClass = (command: string) => [
  'px-3 py-1 border rounded text-sm',
  activeFormats.value[command]
    ? 'bg-blue-500 text-white border-blue-500'
    : 'bg-white hover:bg-blue-100'
]

/* ===========================
   VALIDATION
=========================== */
const validateField = (value: string) => {
  let errorMsg = ''
  const length = settings.value.rich_text
    ? plainTextLength.value
    : value.length

  if (props.item.is_required && !length) {
    errorMsg = 'Field ini harus diisi'
  } else if (settings.value.min_length && length < settings.value.min_length) {
    errorMsg = `Minimal ${settings.value.min_length} karakter`
  } else if (settings.value.max_length && length > settings.value.max_length) {
    errorMsg = `Maksimal ${settings.value.max_length} karakter`
  }

  emit('update:error', errorMsg)
}

const validate = () => {
  validateField(props.modelValue || '')
}


/* ===========================
   RICH TEXT HELPER - Update teks damage
=========================== */
const updateRichTextDamage = (damageTexts: string[]) => {
  if (!editor.value) return

  const selection  = window.getSelection()
  const savedRange = selection && selection.rangeCount > 0
    ? selection.getRangeAt(0).cloneRange()
    : null

  const textNodes: Node[] = []
  const walk = document.createTreeWalker(editor.value, NodeFilter.SHOW_TEXT, null)

  let node
  while (node = walk.nextNode()) {
    if (node.textContent?.trim()) textNodes.push(node)
  }

  if (textNodes.length === 0) {
    editor.value.innerText = joinArrayToText(damageTexts)
  } else {
    textNodes.forEach(n => n.parentNode?.removeChild(n))
    const newTextNode = document.createTextNode(joinArrayToText(damageTexts))
    editor.value.appendChild(newTextNode)
  }

  if (savedRange) {
    try {
      selection?.removeAllRanges()
      selection?.addRange(savedRange)
    } catch (e) {
      // abaikan jika range tidak valid
    }
  }

  editor.value.dispatchEvent(new Event('input', { bubbles: true }))
}

/* ===========================
   DAMAGE LOGIC
=========================== */
const toggleDamage = (damage: any) => {
  const id        = Number(damage.id)
  const valueText = damage.value.trim()

  const currentPlainText = settings.value.rich_text
    ? getPlainText(props.modelValue || '')
    : (props.modelValue || '')

  let currentArray = normalizeTextToArray(currentPlainText)

  if (selectedDamageIds.value.includes(id)) {
    // Uncheck
    selectedDamageIds.value = selectedDamageIds.value.filter(d => d !== id)
    currentArray = currentArray.filter(item => item !== valueText)
  } else {
    // Check
    selectedDamageIds.value.push(id)
    if (!currentArray.includes(valueText)) {
      currentArray.push(valueText)
    }
  }

  const finalPlainText = joinArrayToText(currentArray)

  if (settings.value.rich_text && editor.value) {
    updateRichTextDamage(currentArray)
    emit('update:modelValue', editor.value.innerHTML)
  } else {
    emit('update:modelValue', finalPlainText)
  }

  emit('update:damageIds', selectedDamageIds.value)
  validateField(finalPlainText)
  lastValueWasFromDamage.value = true
}

/* ===========================
   MOUNTED
=========================== */
onMounted(() => {
  if (editor.value && props.modelValue) {
    editor.value.innerHTML = props.modelValue
  }
  syncDamageFromText(props.modelValue || '')
})
</script>