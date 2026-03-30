<template>
  <!-- Tidak ada UI kamera di sini -->
  <!-- Kamera native HP yang handle tampilan -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'


const emit = defineEmits<{
  (e: 'photo', base64: string): void
  (e: 'close'): void
}>()

onMounted(async () => {
  await openCamera()
})

async function openCamera() {
  try {
    // Request permission dulu
    const permission = await Camera.requestPermissions({ permissions: ['camera'] })

    if (permission.camera !== 'granted') {
      console.error('Permission kamera ditolak')
      emit('close')
      return
    }

    // Buka kamera native HP
    const photo = await Camera.getPhoto({
      resultType:       CameraResultType.Base64,
      source:           CameraSource.Camera,  // ← langsung kamera, bukan galeri
      quality:          90,
      allowEditing:     false,
      saveToGallery:    false,
      correctOrientation: true,              // ← otomatis fix orientasi foto
    })

    if (photo.base64String) {
      emit('photo', photo.base64String)
    } else {
      emit('close')
    }

  } catch (err: any) {
    // User cancel → tutup saja, bukan error
    if (err?.message?.includes('cancelled') || err?.message?.includes('canceled') || err?.message?.includes('No image picked')) {
      emit('close')
      return
    }
    console.error('Camera error:', err)
    emit('close')
  }
}
</script>