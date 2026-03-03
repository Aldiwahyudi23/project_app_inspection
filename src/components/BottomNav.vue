<template>
  <nav class="flex justify-around bg-white border-t p-2 fixed bottom-0 w-full">
    <button @click="goTo('home')" :class="active('home')">Home</button>
    <button @click="goTo('job')" :class="active('job')">Tugas</button>
    <button @click="goTo('profile')" :class="active('profile')">Profile</button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const goTo = (name: string) => {
  router.push({ name })
}

const active = (name: string) => {
  return route.name === name ? 'text-blue-500 font-bold' : 'text-gray-500'
}
</script>

<style scoped>
button {
  flex: 1;
  text-align: center;
  padding: 8px 0;
}
</style>
