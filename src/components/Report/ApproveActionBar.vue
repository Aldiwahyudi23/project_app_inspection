//src/components/Report/ApproveActionBar.vue
<template>
  <div
    class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3"
  >
    <button
      @click="$emit('generate-pdf')"
      class="flex-1 rounded-2xl bg-black text-white py-4 font-semibold"
    >
      Generate PDF
    </button>

    <button
      @click="$emit('send-whatsapp')"
      class="flex-1 rounded-2xl bg-green-500 text-white py-4 font-semibold"
    >
      WhatsApp
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits([
  'generate-pdf',
  'send-whatsapp',
])
</script>