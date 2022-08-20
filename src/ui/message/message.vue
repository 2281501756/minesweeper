<script lang="ts" setup>
import { onMounted, ref } from 'vue'
const props = defineProps<{
  type: string
}>()

const main = ref()
const remove = () => {
  if (main.value) {
    main.value.parentElement?.removeChild(main.value)
  }
}
onMounted(() => {
  setTimeout(() => {
    remove()
  }, 2000)
})
</script>

<template>
  <div ref="main" class="main">
    <div class="lose" v-if="props.type === 'lose'">你输了</div>
    <div class="winning" v-if="props.type === 'winning'">你赢了</div>
  </div>
</template>

<style scoped>
.main {
  height: 40px;
  width: 130px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: close 2s ease-in-out;
  color: white;
}
.lose {
  width: 100%;
  height: 100%;
  background-color: red;
  border-radius: 5px;
  text-align: center;
  line-height: 40px;
}
.winning {
  width: 100%;
  height: 100%;
  background-color: green;
  border-radius: 5px;
  text-align: center;
  line-height: 40px;
}
@keyframes close {
  0% {
    transform: translate(-50%, -50%);
  }
  100% {
    transform: translate(-50%, -50px);
    opacity: 0;
  }
}
</style>
