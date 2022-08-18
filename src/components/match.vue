<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { useRouter } from '../router'
import { useStore } from '../store'
const { router, setRouter } = useRouter()
const { username, photo } = window.user
const handerHome = () => {
  setRouter('home')
}

const store = useStore()
store.username = username
store.photo = photo

// 聊天
interface IChat {
  uuid: string
  username: string
  photo: string
  value: string
}
const chatList = ref<IChat[]>([])
store.ws.socket.on('chat', (data: IChat) => {
  chatList.value.push(data)
  if (chatList.value.length > 50) chatList.value.shift()
  nextTick(() => {
    let chat = document.querySelector('.chat') as HTMLDivElement
    chat.scrollTop = chat.scrollHeight
  })
})
const chatData = ref('')
const sendChatData = () => {
  if (chatData.value === '') return
  store.chat(chatData.value)
  chatData.value = ''
}
</script>

<template>
  <div class="match">
    <div class="title">匹配大厅</div>
    <div class="card">
      <div class="user-img-box">
        <img class="user-img" :src="store.photo" />
      </div>
      <div class="user-name">{{ store.username }}</div>
    </div>
    <div class="card">
      <div class="user-img-box">
        <img class="user-img" src="/user.jpg" />
      </div>
      <div class="user-name">匹配中</div>
    </div>
  </div>
  <div class="button-box">
    <button>匹配</button>
    <button @click="handerHome()">返回</button>
  </div>
  <div class="chat-box">
    <div class="chat">
      <div v-for="item in chatList" :key="item.username + item.value">
        <img
          :src="item.photo"
          style="width: 30px; height: 30px; border-radius: 50%; margin-right: 3px"
          alt="头像"
        />
        <span style="vertical-align: super">{{ item.username + ' : ' + item.value }}</span>
      </div>
    </div>
    <input v-model="chatData" @keyup.enter="sendChatData()" type="text" />
  </div>
</template>

<style scoped>
.match {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: top;
}
.title {
  position: absolute;
  top: 5%;
  left: 0;
  right: 0;
  letter-spacing: 0.2em;
  text-align: center;
  font-size: 40px;
  color: #fff;
}
.card {
  margin-top: 100px;
  width: 18%;
  height: 55%;
  border-radius: 20px;
  border: 5px solid #666;
  background-color: #111;
}
.user-img-box {
  height: 65%;
  margin: 0 auto;
  position: relative;
}
.user-img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: auto;
  width: 80%;
  border-radius: 50%;
  aspect-ratio: 1/1;
  background-color: red;
  border: 2px solid #777;
}
.user-name {
  height: 35%;
  display: flex;
  justify-content: center;
  font-size: 30px;
  color: #fff;
  align-items: center;
}
.button-box {
  position: absolute;
  bottom: 1%;
  width: 100%;
  text-align: center;
}
.button-box > button {
  width: 120px;
  height: 50px;
  margin: 30px;
  border: none;
  outline: none;
  font-size: 20px;
  border-radius: 25px;
  background-color: #488f85;
  color: #fff;
  cursor: pointer;
}
.chat-box {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 30%;
  width: 25%;
  background-color: #000;
}
.chat-box > input {
  width: 100%;
  height: 30px;
}
.chat {
  height: calc(100% - 30px);
  color: #fff;
  overflow-y: scroll;
}

.chat::-webkit-resizer,
.chat::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 3px;
}
.chat::-webkit-scrollbar-corner,
.chat::-webkit-scrollbar-track {
  background: 0 0;
}
.chat::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
</style>
