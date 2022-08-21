<script lang="ts" setup>
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router'
import { useStore } from '../store'
const { router, setRouter } = useRouter()
const handerHome = () => {
  setRouter('home')
}

const store = useStore()
onMounted(() => {
  const { username, photo } = window.user
  store.username = username
  store.photo = photo
})

// 聊天
interface IChat {
  uuid: string
  username: string
  photo: string
  value: string
}
const chatList = ref<IChat[]>([])
const chatCallback = (data: IChat) => {
  chatList.value.push(data)
  if (chatList.value.length > 50) chatList.value.shift()
  nextTick(() => {
    let chat = document.querySelector('.chat') as HTMLDivElement
    chat.scrollTop = chat.scrollHeight
  })
}
const chatData = ref('')
const sendChatData = () => {
  if (chatData.value === '') return
  store.chat(chatData.value)
  chatData.value = ''
}
store.ws.socket.on('chat', chatCallback)

// 匹配
const isMatch = ref(false)
const matchTime = ref(0)
const perpare = ref(false)
let MATCH_TIMER = 0
// 计算匹配时间
const showTime = computed(() => {
  let m: number | string = (matchTime.value / 60) | 0
  let s: number | string = matchTime.value % 60
  let res = ''
  if (m < 10) res += '0' + m
  else res += m
  res += ':'
  if (s < 10) res += '0' + s
  else res += s
  return res
})
const matchCallback = (data: { roomid: string; uuid: string; roomSeat: number; enemy: any }) => {
  if (data.uuid !== store.ws.id) return
  store.MatchSucceed = true
  store.roomid = data.roomid
  store.roomSeat = data.roomSeat
  store.enemy = data.enemy

  matchTime.value = 0
  store.ws.socket.on('enemyLeaveRoom', enemyLeaveRoomCallback)
  store.ws.socket.on('enemyPrepared', enemyPreparedCallback)
  store.ws.socket.on('enemyClosePrepared', enemyClosePreparedCallback)
  store.ws.socket.on('gamePlay', gamePlayCallback)
  clearInterval(MATCH_TIMER)
}

const enemyLeaveRoomCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid && data.uuid !== store.ws.id) return
  store.MatchSucceed = false
  store.enemy = {
    uuid: 'string',
    username: 'string',
    photo: 'string',
    roomSeat: 1,
    prepared: false,
    blockState: [],
    time: 1,
    lastMines: 1,
  }
  store.roomSeat = 1
  store.roomid = ''
  perpare.value = false
  isMatch.value = false
}
const enemyPreparedCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.prepared = true
}
const enemyClosePreparedCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.prepared = false
}

const countDown = ref(5)
let GAMEPLAYTIMER = -1
const gamePlayCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid) return
  store.GameStart = true
  if (GAMEPLAYTIMER === -1)
    GAMEPLAYTIMER = setInterval(() => {
      countDown.value--
    }, 1000)
  setTimeout(() => {
    clearInterval(GAMEPLAYTIMER)
    setRouter('multiGame')
  }, 5000)
}

const handleMatch = () => {
  isMatch.value = true
  store.match()
  store.ws.socket.on('matchSucceed', matchCallback)
  MATCH_TIMER = setInterval(() => {
    matchTime.value++
  }, 1000)
}
const handleStopMatch = () => {
  isMatch.value = false
  matchTime.value = 0
  store.ws.socket.emit('matchClose', { uuid: store.ws.id })
  store.ws.socket.off('matchSucceed', matchCallback)
  store.ws.socket.off('enemyLeaveRoom', enemyLeaveRoomCallback)
  store.ws.socket.off('enemyPrepared', enemyPreparedCallback)
  store.ws.socket.off('enemyClosePrepared', enemyClosePreparedCallback)
  store.ws.socket.off('gamePlay', gamePlayCallback)
  clearInterval(MATCH_TIMER)
}
const handlePerpare = () => {
  perpare.value = true
  store.ws.socket.emit('playPrepared', {
    uuid: store.ws.id,
    roomid: store.roomid,
    roomSeat: store.roomSeat,
  })
}
const handleClosePerpare = () => {
  perpare.value = false
  store.ws.socket.emit('closePrepared', {
    uuid: store.ws.id,
    roomid: store.roomid,
    roomSeat: store.roomSeat,
  })
}
const handleRemoveRoom = () => {
  store.ws.socket.emit('leaveRoom', {
    uuid: store.ws.id,
    roomid: store.roomid,
    roomSeat: store.roomSeat,
  })
  store.ws.socket.off('enemyLeaveRoom', enemyLeaveRoomCallback)

  store.roomid = ''
  store.roomSeat = 1
  store.MatchSucceed = false
  store.enemy = {
    uuid: 'string',
    username: 'string',
    photo: 'string',
    roomSeat: 1,
    prepared: false,
    blockState: [],
    time: 1,
    lastMines: 1,
  }
  perpare.value = false
  isMatch.value = false
}

onUnmounted(() => {
  store.ws.socket.off('chat', chatCallback)
  store.ws.socket.off('matchSucceed', matchCallback)
  store.ws.socket.off('enemyLeaveRoom', enemyLeaveRoomCallback)
  store.ws.socket.off('enemyPrepared', enemyPreparedCallback)
  store.ws.socket.off('enemyClosePrepared', enemyClosePreparedCallback)
  store.ws.socket.off('gamePlay', gamePlayCallback)
})
</script>

<template>
  <div class="match">
    <div class="title">匹配大厅</div>
    <div class="card">
      <div class="user-img-box">
        <img class="user-img" :src="store.photo" />
      </div>
      <div class="user-name">{{ store.username }}</div>
      <div class="prepared-box" v-if="perpare">已准备</div>
    </div>
    <div class="card">
      <div class="user-img-box">
        <img v-if="!store.MatchSucceed" class="user-img" src="/user.jpg" />
        <img v-else class="user-img" :src="store.enemy.photo" />
      </div>
      <div v-if="!store.MatchSucceed" class="user-name">匹配中</div>
      <div v-else class="user-name">{{ store.enemy.username }}</div>
      <div class="prepared-box" v-if="store.enemy.prepared">已准备</div>
    </div>
  </div>
  <div class="match-time" v-show="isMatch && !store.MatchSucceed">{{ showTime }}</div>
  <div class="button-box" v-if="!store.GameStart">
    <button v-if="!isMatch" @click="handleMatch()">匹配</button>
    <button v-else-if="!store.MatchSucceed" @click="handleStopMatch()">取消</button>
    <button v-else-if="!perpare" @click="handlePerpare()">准备</button>
    <button v-else @click="handleClosePerpare()">取消</button>
    <button v-if="!store.MatchSucceed" @click="handerHome()">返回</button>
    <button v-else @click="handleRemoveRoom()">退出</button>
  </div>
  <div class="chat-box">
    <div class="chat">
      <div v-for="item in chatList" :key="item.username + item.value">
        <img
          :src="item.photo"
          style="width: 30px; height: 30px; border-radius: 50%; margin-right: 3px"
          alt="头像"
        />
        <span style="vertical-align: middle">{{ item.username + ' : ' + item.value }}</span>
      </div>
    </div>
    <input v-model="chatData" @keyup.enter="sendChatData()" type="text" />
  </div>
  <div class="countDown-box" v-if="store.GameStart">{{ countDown }}</div>
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
  position: relative;
  overflow: hidden;
  margin-top: 100px;
  width: 18%;
  height: 55%;
  border-radius: 20px;
  border: 3px solid #666;
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
.button-box > button:active {
  transform: scale(0.9);
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
.match-time {
  position: relative;
  bottom: 20%;
  text-align: center;
  font-size: 20px;
  color: #fff;
}
.prepared-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.countDown-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 80px;
  cursor: pointer;
}
</style>
