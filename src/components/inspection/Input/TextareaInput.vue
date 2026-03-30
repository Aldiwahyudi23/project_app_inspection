<!-- components/inspection/inputs/TextareaInput.vue -->
<template>
  <div class="space-y-2">

    <!-- DAMAGE OPTIONS — tampilan kecil -->
    <div v-if="settings.show_damage && damageList.length" class="space-y-1">
      <div class="text-xs text-gray-400 font-medium">Kerusakan:</div>
      <div class="flex flex-wrap gap-1">
        <div
          v-for="damage in damageList"
          :key="damage.id"
          @click="toggleDamage(damage)"
          class="px-1.5 py-0.5 rounded-full border text-[11px] cursor-pointer transition-all select-none"
          :class="selectedDamageIds.includes(Number(damage.id))
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500'"
        >
          {{ damage.label }}
        </div>
      </div>
    </div>

    <!-- RICH TEXT MODE -->
    <div v-if="settings.rich_text">
      <div class="flex flex-wrap gap-2 border rounded-lg p-2 bg-gray-50">
        <button type="button" @click="format('bold')" :class="toolbarClass('bold')"><b>B</b></button>
        <button type="button" @click="format('italic')" :class="toolbarClass('italic')"><i>I</i></button>
        <button type="button" @click="format('insertUnorderedList')" :class="toolbarClass('insertUnorderedList')">•</button>
        <button type="button" @click="format('insertOrderedList')" :class="toolbarClass('insertOrderedList')">1.</button>
      </div>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        Mendukung format teks kaya
      </div>
    </div>

    <!-- NORMAL TEXTAREA -->
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

    <!-- CHARACTER COUNTER -->
    <div class="flex justify-between items-center mt-1">
      <p v-if="props.item.is_required" class="text-xs text-red-400">
        Wajib di isi
      </p>
      <div v-if="settings.max_length" class="text-xs text-gray-400 ml-auto">
        {{ plainTextLength }} / {{ settings.max_length }}
      </div>
    </div>

    <!-- ERROR MESSAGE -->
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
  item:             FormItem
  modelValue:       string
  error?:           string
  activeDamageIds?: number[] | null
}>()

const emit = defineEmits([
  'update:modelValue',
  'update:error',
  'update:damageIds',
])

const settings               = computed(() => props.item.settings || {})
const editor                 = ref<HTMLElement | null>(null)
const activeFormats          = ref<Record<string, boolean>>({})
const lastValueWasFromDamage = ref(false)

// ── Damage data ───────────────────────────────────────────────
const damageList = computed(() =>
  (settings.value.damage_ids || []) as Array<{ id: number | string; label: string; value: string }>
)

// ── selectedDamageIds — sumber kebenaran UI pill ──────────────
const selectedDamageIds = ref<number[]>([])

// ── Sync activeDamageIds dari OptionRenderer ──────────────────
watch(
  () => props.activeDamageIds,
  (newIds) => {
    if (!newIds) return
    const normalized = newIds.map(Number)
    const current    = [...selectedDamageIds.value].sort().join(',')
    const incoming   = [...normalized].sort().join(',')
    if (current !== incoming) {
      selectedDamageIds.value = normalized
      // Tidak emit update:damageIds — OptionRenderer sudah handle
    }
  },
  { immediate: true }
)

// ── Plain text length ─────────────────────────────────────────
const plainTextLength = computed(() => {
  if (!settings.value.rich_text) return (props.modelValue || '').length
  const div = document.createElement('div')
  div.innerHTML = props.modelValue || ''
  return div.innerText.length
})

// ── Plain text extraction ─────────────────────────────────────
const getPlainText = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.innerText
}

// ── Normalize helpers — HANYA untuk damage text ───────────────
const normalizeTextToArray = (text: string): string[] =>
  text.split(',').map(t => t.trim()).filter(t => t.length > 0)

const joinArrayToText = (arr: string[]): string => arr.join(', ')

// ── Sync damage dari teks (ketik manual) ─────────────────────
const syncDamageFromText = (text: string) => {
  const plainText = settings.value.rich_text ? getPlainText(text) : text
  const textArray = normalizeTextToArray(plainText)

  const newSelectedIds = damageList.value
    .filter(damage => textArray.includes(damage.value.trim()))
    .map(damage => Number(damage.id))

  if (props.activeDamageIds !== undefined && props.activeDamageIds !== null) {
    const validIds = props.activeDamageIds.map(Number)
    selectedDamageIds.value = newSelectedIds.filter(id => validIds.includes(id))
  } else {
    selectedDamageIds.value = newSelectedIds
  }

  emit('update:damageIds', selectedDamageIds.value)
}

// ── Watch modelValue ──────────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  syncDamageFromText(newVal || '')
  if (settings.value.rich_text && editor.value && document.activeElement !== editor.value) {
    editor.value.innerHTML = newVal || ''
  }
}, { immediate: true })

// ── Normal input handler ──────────────────────────────────────
// TIDAK normalize — biarkan user ketik bebas termasuk spasi
const handleNormalInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', value)
  validateField(value)
  // Reset flag agar intercept berhenti setelah user mulai ketik manual
  lastValueWasFromDamage.value = false
}

// ── Normal keydown handler ────────────────────────────────────
// FIX UTAMA: spasi (' ') masuk freeKeys → TIDAK PERNAH diintercept
// Hanya intercept karakter pertama setelah damage dipilih
// untuk sisipkan ", " otomatis sebelum karakter tersebut.
const handleNormalKeydown = (e: KeyboardEvent) => {
  // Key-key ini SELALU bebas, tidak pernah diintercept
  const freeKeys = [
    ' ', 'Backspace', 'Delete', 'Enter', 'Tab',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'Escape', 'CapsLock', 'Shift',
    'Control', 'Alt', 'Meta', 'PageUp', 'PageDown',
  ]

  if (freeKeys.includes(e.key)) {
    // Spasi atau Enter → user lanjut ketik, reset flag
    if (e.key === ' ' || e.key === 'Enter') lastValueWasFromDamage.value = false
    return
  }

  // Modifier key kombinasi (ctrl+c, ctrl+v, dll) → biarkan
  if (e.ctrlKey || e.metaKey || e.altKey) return

  // Hanya intercept jika flag aktif dan ini printable character
  if (!lastValueWasFromDamage.value) return
  if (e.key.length !== 1) return

  const textarea = e.target as HTMLTextAreaElement
  const value    = textarea.value

  // Jika sudah diakhiri koma → tidak perlu sisipkan lagi, reset flag
  if (value.trimEnd().endsWith(',')) {
    lastValueWasFromDamage.value = false
    return
  }

  // Sisipkan ", " sebelum karakter yang diketik
  e.preventDefault()
  const newValue = value.trimEnd() + ', ' + e.key
  emit('update:modelValue', newValue)
  lastValueWasFromDamage.value = false

  // Posisikan cursor ke akhir setelah Vue update DOM
  requestAnimationFrame(() => {
    textarea.setSelectionRange(newValue.length, newValue.length)
  })
}

// ── Rich text input handler ───────────────────────────────────
const handleRichInput = () => {
  if (!editor.value) return
  const html = settings.value.allow_html
    ? editor.value.innerHTML
    : editor.value.innerText
  emit('update:modelValue', html)
  validateField(html)
  lastValueWasFromDamage.value = false
}

// ── Rich text keydown handler ─────────────────────────────────
const handleRichKeydown = (e: KeyboardEvent) => {
  const freeKeys = [
    ' ', 'Backspace', 'Delete', 'Enter', 'Tab',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'Escape', 'CapsLock', 'Shift',
    'Control', 'Alt', 'Meta', 'PageUp', 'PageDown',
  ]

  if (freeKeys.includes(e.key)) {
    if (e.key === ' ' || e.key === 'Enter') lastValueWasFromDamage.value = false
    return
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (!lastValueWasFromDamage.value || !editor.value) return
  if (e.key.length !== 1) return

  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return

  const range       = selection.getRangeAt(0)
  const textContent = editor.value.innerText

  // Hanya intercept jika cursor di akhir teks
  const isAtEnd =
    range.endOffset === textContent.length &&
    range.endContainer === editor.value.lastChild

  if (!isAtEnd) return

  if (textContent.trimEnd().endsWith(',')) {
    lastValueWasFromDamage.value = false
    return
  }

  e.preventDefault()
  document.execCommand('insertText', false, ', ' + e.key)
  lastValueWasFromDamage.value = false
}

// ── Rich text format toolbar ──────────────────────────────────
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
    : 'bg-white hover:bg-blue-100',
]

// ── Validation ────────────────────────────────────────────────
const validateField = (value: string) => {
  let errorMsg = ''
  const length = settings.value.rich_text ? plainTextLength.value : value.length

  if (props.item.is_required && !length) {
    errorMsg = 'Field ini harus diisi'
  } else if (settings.value.min_length && length < settings.value.min_length) {
    errorMsg = `Minimal ${settings.value.min_length} karakter`
  } else if (settings.value.max_length && length > settings.value.max_length) {
    errorMsg = `Maksimal ${settings.value.max_length} karakter`
  }

  emit('update:error', errorMsg)
}

const validate = () => validateField(props.modelValue || '')

// ── Rich text damage helper ───────────────────────────────────
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
    } catch (_) {}
  }

  editor.value.dispatchEvent(new Event('input', { bubbles: true }))
}

// ── Damage toggle ─────────────────────────────────────────────
const toggleDamage = (damage: any) => {
  const id        = Number(damage.id)
  const valueText = damage.value.trim()

  const currentPlainText = settings.value.rich_text
    ? getPlainText(props.modelValue || '')
    : (props.modelValue || '')

  let currentArray = normalizeTextToArray(currentPlainText)

  if (selectedDamageIds.value.includes(id)) {
    selectedDamageIds.value = selectedDamageIds.value.filter(d => d !== id)
    currentArray = currentArray.filter(item => item !== valueText)
  } else {
    selectedDamageIds.value.push(id)
    if (!currentArray.includes(valueText)) currentArray.push(valueText)
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

// ── Mounted ───────────────────────────────────────────────────
onMounted(() => {
  if (editor.value && props.modelValue) {
    editor.value.innerHTML = props.modelValue
  }
  syncDamageFromText(props.modelValue || '')
})
</script>