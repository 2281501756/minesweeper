<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from './router'
import gameVue from './components/game.vue'
import homeVue from './components/home.vue'
import Match from './components/match.vue'
const root = ref<HTMLDivElement>()
const { router, setRouter } = useRouter()

onMounted(() => {
  let dom = root.value?.parentElement
  if (dom) {
    dom.style.backgroundColor = '#1f1f1f'
  }
})
</script>

<template>
  <div class="root" ref="root">
    <home-vue v-if="router === 'home'"></home-vue>
    <game-vue v-if="router === 'game'"></game-vue>
    <match v-if="router === 'match'"></match>
  </div>
</template>

<style scoped>
.root {
  background-color: #1f1f1f;
  overflow: hidden;
  height: 100%;
  position: relative;
}
</style>
