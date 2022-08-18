<script lang="ts" setup>
import axios from 'axios'
import BASE_URL from '../util/baseURL'
import { getDate } from '../util/getDate'
import { onUnmounted, onMounted, ref } from 'vue'
type ListData = {
  id: string
  time: number
  create_time: string
  user: {
    openid: string
    photo: string
    user_name: string
  }
}

enum ListType {
  easy,
  medium,
  difficulty,
  active,
}
const emit = defineEmits<{
  (e: 'close'): void
}>()
function handerClose() {
  emit('close')
}
const listType = ref<ListType>(ListType.easy)
const listData = ref<ListData[]>()
function handerMenu(type: ListType) {
  listType.value = type
  getData()
}
async function getData() {
  let res = await (
    await axios({
      url: BASE_URL + '/mineSweeper/list',
      method: 'GET',
      params: {
        type:
          listType.value === ListType.easy
            ? 'easy'
            : listType.value === ListType.medium
            ? 'medium'
            : listType.value === ListType.difficulty
            ? 'difficulty'
            : 'active',
      },
    })
  ).data
  listData.value = res
}
onMounted(() => {
  getData()
})

// 滚动事件
const scroll = ref<HTMLDivElement>()
function onmousewheel(e: any) {
  let dom = scroll.value
  if (e.wheelDelta > 0 && dom) {
    dom.scrollTop -= 40
  } else if (e.wheelDelta < 0 && dom) {
    dom.scrollTop += 40
  }
}
onMounted(() => {
  if (scroll.value) scroll.value.addEventListener('mousewheel', onmousewheel, false)
})
onUnmounted(() => {
  if (scroll.value) scroll.value.removeEventListener('mousewheel', onmousewheel)
})
</script>
<template>
  <div class="list">
    <div class="list-header">
      <img @click="handerClose()" src="../assets/close.svg" alt="" />
    </div>
    <div class="list-body">
      <div class="list-body-left">
        <div>
          <span
            :class="{ 'active-span': listType === ListType.easy }"
            @click="handerMenu(ListType.easy)"
            >入门竞速榜</span
          >
        </div>
        <div>
          <span
            :class="{ 'active-span': listType === ListType.medium }"
            @click="handerMenu(ListType.medium)"
            >大师竞速榜</span
          >
        </div>
        <div>
          <span
            :class="{ 'active-span': listType === ListType.difficulty }"
            @click="handerMenu(ListType.difficulty)"
            >专家竞速榜</span
          >
        </div>
        <div>
          <span
            :class="{ 'active-span': listType === ListType.active }"
            @click="handerMenu(ListType.active)"
            >活跃玩家</span
          >
        </div>
      </div>
      <div ref="scroll" class="list-body-right">
        <div class="list-body-right-header">
          <div>排名</div>
          <div>玩家</div>
          <div>时间</div>
          <div>日期</div>
        </div>
        <template v-for="(item, i) in listData" :key="item.id">
          <div class="list-body-right-body">
            <div class="index">{{ '#' + (i + 1) }}</div>
            <div class="data">
              <img :src="item.user.photo" alt="" />
              {{ item.user.user_name }}
            </div>
            <div class="data">{{ item.time }}</div>
            <div class="data">{{ getDate(item.create_time) }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.list {
  width: 90%;
  height: 90%;
  border-radius: 10px;
  background-color: #2c2f3b;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  padding: 10px 20px;
  color: #f0f0f0;
}
.list-header {
  height: 40px;
  text-align: right;
  & > img {
    height: 30px;
    width: 30px;
  }
}
.list-body-right::-webkit-resizer,
.list-body-right::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 3px;
}
.list-body-right::-webkit-scrollbar-corner,
.list-body-right::-webkit-scrollbar-track {
  background: 0 0;
}
.list-body-right::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.list-body {
  display: flex;
  height: calc(100% - 60px);
  &-left {
    width: 150px;
    border: #aaa solid 1px;

    & > div {
      height: 25%;
      display: flex;
      justify-content: center;
      align-items: center;

      span {
        height: 50px;
        width: 120px;
        text-align: center;
        line-height: 50px;
        background-color: #31322c;
        border-radius: 10px;
        user-select: none;
        cursor: pointer;
      }
      .active-span {
        border: white solid 1px;
      }
    }
  }
  &-right {
    width: calc(100% - 200px);
    border: #aaa solid 1px;
    overflow-y: scroll;

    &-header {
      div {
        font-size: 18px;
        display: inline-block;
        text-align: center;
        width: 25%;
      }
    }
    &-body {
      div {
        display: inline-block;
        text-align: center;
        width: 25%;
        font-size: 14px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        word-break: break-all;
      }
    }
  }
}
img {
  height: 25px;
  width: 25px;
  border-radius: 50%;
}
</style>
