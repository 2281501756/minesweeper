<template>
  <div class="root" ref="root">
    <game-vue></game-vue>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import gameVue from './components/game.vue'
const root = ref<HTMLDivElement>()
onMounted(() => {

  let dom = root.value?.parentElement
  if (dom) {
    dom.style.backgroundColor = '#1f1f1f'
  }
})
</script>

<style scoped>
.root {
  background-color: #1f1f1f;
  overflow: auto;
}
</style>
