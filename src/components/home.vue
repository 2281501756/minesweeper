<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from '../router'
import topListVue from './topList.vue'

const { router, setRouter } = useRouter()
const handleGame = () => {
  setRouter('game')
}
const handleMatch = () => {
  setRouter('match')
}
const handleClose = () => {
  if (window.AcWingOS) {
    window.AcWingOS.api.window.close()
  }
}

// 排行榜
let topListShown = ref(false)
function topListOpen() {
  topListShown.value = true
}
function topListClose() {
  topListShown.value = false
}

//
</script>

<template>
  <div class="container">
    <div class="title">扫雷</div>
    <div class="button" @click="handleGame()">开始游戏</div>
    <div class="button" @click="handleMatch()">多人匹配</div>
    <div class="button" @click="topListOpen()">排行榜</div>
    <div class="button" @click="handleClose()">退出</div>
    <top-list-vue @close="topListClose()" v-if="topListShown"></top-list-vue>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: #1f1f1f;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  position: relative;
}
.title {
  font-size: 40px;
}
.button {
  width: 150px;
  height: 50px;
  line-height: 50px;
  border-radius: 5px;
  color: #fff;
  background-color: #488f85;
  text-align: center;
  font-size: 28px;
  cursor: pointer;
}
.button:active {
  transform: scale(0.98);
}
</style>
