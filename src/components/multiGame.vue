<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import { useStore } from '../store'
import { IBlockState } from './type'
import { createMessage } from '../ui/message'
import { useRouter } from '../router'
const store = useStore()

const play1 = ref<HTMLDivElement>()
const play2 = ref<HTMLDivElement>()
// 聊天系统
const play1Chat = ref<HTMLDivElement>()
const play2Chat = ref<HTMLDivElement>()
const input = ref()

let play1ChatTimer = -1
const play1HandleChat = () => {
  if (input.value === '' || !play1Chat.value) return
  play1Chat.value.style.display = 'block'
  play1Chat.value.innerHTML = input.value
  store.ws.socket.emit('roomChat', { roomid: store.roomid, uuid: store.ws.id, value: input.value })
  input.value = ''
  if (play1ChatTimer !== -1) {
    clearInterval(play1ChatTimer)
  }
  play1ChatTimer = setTimeout(() => {
    if (play1Chat.value) play1Chat.value.style.display = 'none'
    play1ChatTimer = -1
  }, 5000)
}

let play2ChatTimer = -1
const play2HandleChat = (v: string) => {
  if (v === '' || !play2Chat.value) return
  play2Chat.value.style.display = 'block'
  play2Chat.value.innerHTML = v
  if (play2ChatTimer !== -1) {
    clearInterval(play2ChatTimer)
  }
  play2ChatTimer = setTimeout(() => {
    if (play2Chat.value) play2Chat.value.style.display = 'none'
    play2ChatTimer = -1
  }, 5000)
}
const roomChatCallback = (data: { roomid: string; uuid: string; value: string }) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  play2HandleChat(data.value)
}
onMounted(() => {
  store.ws.socket.on('roomChat', roomChatCallback)
})
onUnmounted(() => {
  store.ws.socket.off('roomChat', roomChatCallback)
})

// 游戏系统

let HEIGHT = 10
let WIDTH = 10
let COUNT = 10
let FIRST_CLICK = true
let GAME_IS_OVER = ref(false)
let time = ref('0')
let lastMines = ref(10)
let blockState = ref(
  Array.from({ length: HEIGHT }, (_, y) =>
    Array.from(
      { length: WIDTH },
      (_, x): IBlockState => ({
        x: x,
        y: y,
        mine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
      })
    )
  )
)
const placeMines = (x: number, y: number) => {
  for (let i = 0; i < COUNT; ) {
    let x1 = (Math.random() * WIDTH) | 0
    let y1 = (Math.random() * HEIGHT) | 0
    if (!blockState.value[y1][x1].mine && x !== x1 && y !== y1) {
      blockState.value[y1][x1].mine = true
      i++
    }
  }
}
const offset: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]
const getOffsetList = (y: number, x: number): [number, number][] => {
  let res: [number, number][] = []
  offset.forEach(([dy, dx]) => {
    let tx = x + dx,
      ty = y + dy
    if (tx < 0 || tx >= WIDTH || ty < 0 || ty >= HEIGHT) return
    res.push([ty, tx])
  })
  return res
}
const getAjacentMinesNumber = () => {
  blockState.value.forEach((row, y) => {
    row.forEach((block, x) => {
      let mineNumber = 0
      if (block.mine) return
      for (const [y1, x1] of offset) {
        let tx = x1 + x,
          ty = y1 + y
        if (tx < 0 || ty < 0 || tx > WIDTH - 1 || ty > HEIGHT - 1 || !blockState.value[ty][tx].mine)
          continue

        mineNumber++
      }
      block.adjacentMines = mineNumber
    })
  })
}
const clickZone = (y: number, x: number) => {
  blockState.value[y][x].revealed = true
  getOffsetList(y, x).forEach(([ty, tx]) => {
    if (blockState.value[ty][tx].adjacentMines === 0 && !blockState.value[ty][tx].revealed)
      clickZone(ty, tx)
    blockState.value[ty][tx].revealed = true
  })
}
const checkWinning = () => {
  let list = blockState.value.flat()

  if (
    list.every((i) => {
      return i.revealed || i.mine
    })
  ) {
    list.forEach((i) => {
      if (i.mine) i.flagged = true
    })
    clearTime()
    lastMines.value = 0
    GAME_IS_OVER.value = true
    setTimeout(() => {
      if (!play1.value) return
      createMessage(play1.value, { type: 'winning' })
    }, 1000)
    flower()
    store.ws.socket.emit('gamePlayWinning', {
      roomid: store.roomid,
      uuid: store.ws.id,
      blockState: blockState.value,
      lastMines: lastMines.value,
      time: time.value,
    })
  }
}
const addFlag = (x: number, y: number) => {
  if (GAME_IS_OVER.value) return
  if (blockState.value[y][x].revealed) return
  if (blockState.value[y][x].flagged) {
    blockState.value[y][x].flagged = false
    lastMines.value++
  } else {
    blockState.value[y][x].flagged = true
    lastMines.value--
  }
  checkWinning()
  store.ws.socket.emit('gamePlayHandler', {
    roomid: store.roomid,
    uuid: store.ws.id,
    blockState: blockState.value,
    lastMines: lastMines.value,
  })
}
const handerDoubleBlock = (y: number, x: number) => {
  if (
    !blockState.value[y][x].revealed ||
    blockState.value[y][x].flagged ||
    blockState.value[y][x].mine ||
    blockState.value[y][x].adjacentMines === 0
  )
    return
  let mineFlagNumber = 0 // 正确标记炸弹的个数
  let allFlagNumber = 0 // 标记的个数
  let noRevealedNumber = 0 // 没有翻开的个数
  getOffsetList(y, x).forEach(([ty, tx]) => {
    if (blockState.value[ty][tx].flagged) allFlagNumber++
    if (!blockState.value[ty][tx].revealed) noRevealedNumber++
    if (blockState.value[ty][tx].flagged && blockState.value[ty][tx].mine) mineFlagNumber++
  })

  if (noRevealedNumber === blockState.value[y][x].adjacentMines) {
    // 自动标记
    getOffsetList(y, x).forEach(([ty, tx]) => {
      if (!blockState.value[ty][tx].revealed && !blockState.value[ty][tx].flagged) {
        blockState.value[ty][tx].flagged = true
        lastMines.value--
      }
    })
  } else if (
    mineFlagNumber === blockState.value[y][x].adjacentMines &&
    mineFlagNumber === allFlagNumber
  ) {
    // 正确式展开
    getOffsetList(y, x).forEach(([ty, tx]) => {
      if (!blockState.value[ty][tx].mine && !blockState.value[ty][tx].revealed)
        blockState.value[ty][tx].revealed = true
    })
  } else if (allFlagNumber === blockState.value[y][x].adjacentMines) {
    getOffsetList(y, x).forEach(([ty, tx]) => {
      if (!blockState.value[ty][tx].mine && !blockState.value[ty][tx].revealed)
        blockState.value[ty][tx].revealed = true
    })
    gameover()
  }
  checkWinning()
  store.ws.socket.emit('gamePlayHandler', {
    roomid: store.roomid,
    uuid: store.ws.id,
    blockState: blockState.value,
    lastMines: lastMines.value,
  })
}
const gameover = () => {
  clearTime()
  GAME_IS_OVER.value = true
  for (const row of blockState.value) {
    for (const block of row) {
      if (block.mine) block.revealed = true
    }
  }
  if (play1.value) createMessage(play1.value, { type: 'lose' })
  store.ws.socket.emit('gamePlayGameOver', {
    roomid: store.roomid,
    uuid: store.ws.id,
    blockState: blockState.value,
    lastMines: lastMines.value,
    time: time.value,
  })
}
const handerBlock = (x: number, y: number) => {
  if (GAME_IS_OVER.value) return
  if (FIRST_CLICK) {
    placeMines(x, y)
    getAjacentMinesNumber()
    setTime()
    store.ws.socket.emit('gamePlayStartGame', { roomid: store.roomid, uuid: store.ws.id })
    FIRST_CLICK = false
  }
  blockState.value[y][x].revealed = true
  if (blockState.value[y][x].flagged) {
    lastMines.value++
    blockState.value[y][x].flagged = false
  }
  if (blockState.value[y][x].adjacentMines === 0 && !blockState.value[y][x].mine) clickZone(y, x)
  if (blockState.value[y][x].mine) gameover()
  checkWinning()
  store.ws.socket.emit('gamePlayHandler', {
    roomid: store.roomid,
    uuid: store.ws.id,
    blockState: blockState.value,
    lastMines: lastMines.value,
  })
}
function newGame() {
  clearTime()
  time.value = '0'
  lastMines.value = COUNT
  GAME_IS_OVER.value = false
  FIRST_CLICK = true
  blockState.value = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from(
      { length: WIDTH },
      (_, x): IBlockState => ({
        x: x,
        y: y,
        mine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
      })
    )
  )
  store.ws.socket.emit('gamePlayNewGame', {
    roomid: store.roomid,
    uuid: store.ws.id,
    blockState: blockState.value,
    lastMines: lastMines.value,
  })
}

// 时间模块
let TIMEID = 0
function setTime() {
  TIMEID = setInterval(() => {
    time.value = (parseFloat(time.value) + 0.017).toFixed(3)
  }, 17)
}
function clearTime() {
  clearInterval(TIMEID)
}

// 撒花
let myCanvas = document.createElement('canvas')
onMounted(() => {
  if (!play1.value) return
  myCanvas.id = 'game-canvas'
  myCanvas.width = play1.value.clientWidth
  myCanvas.height = play1.value.clientHeight
  myCanvas.style.position = 'absolute'
  myCanvas.style.left = '0'
  myCanvas.style.top = '0'
  myCanvas.style.pointerEvents = 'none'
  play1.value.appendChild(myCanvas)
})
let TIMER = setInterval(() => {
  if (!play1.value) return
  myCanvas.width = play1.value.clientWidth
  myCanvas.height = play1.value.clientHeight
}, 1000)
onUnmounted(() => {
  if (!play1.value) return
  play1.value.removeChild(myCanvas)
  clearInterval(TIMER)
})
let myConfetti = confetti.create(myCanvas, { resize: true })
function flower() {
  let end = Date.now() + 1 * 1000
  let colors = ['#bb0000', '#ffffff', '#5aa4ae']

  ;(function frame() {
    myConfetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    myConfetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
const { router, setRouter } = useRouter()
const handleLeaveRoom = () => {
  store.ws.socket.emit('gamePlayLeave', {
    roomid: store.roomid,
    uuid: store.ws.id,
    roomSeat: store.roomSeat,
  })
  store.roomid = ''
  store.roomSeat = 1
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
  store.GameStart = false
  store.MatchSucceed = false
  setRouter('match')
}

// 敌人模块
let ENEMY_GAME_IS_OVER = ref(false)
const enemyOnRoom = ref(true)

const gamePlayHandlerCallback = (data: {
  roomid: string
  uuid: string
  blockState: IBlockState[][]
  lastMines: number
}) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.blockState = data.blockState
  store.enemy.lastMines = data.lastMines
}

const gamePlayNewGameCallback = (data: {
  roomid: string
  uuid: string
  blockState: IBlockState[][]
  lastMines: number
}) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.blockState = data.blockState
  store.enemy.lastMines = data.lastMines
  ENEMY_GAME_IS_OVER.value = false
  time2.value = '0'
  clearTime2()
}

const gamePlayGameOverCallback = (data: {
  roomid: string
  uuid: string
  blockState: IBlockState[][]
  lastMines: number
  time: string
}) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.blockState = data.blockState
  store.enemy.lastMines = data.lastMines
  ENEMY_GAME_IS_OVER.value = true
  if (play2.value) createMessage(play2.value, { type: 'lose' })
  clearTime2()
  time2.value = data.time
}
const gamePlayWinningCallback = (data: {
  roomid: string
  uuid: string
  blockState: IBlockState[][]
  lastMines: number
  time: string
}) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  store.enemy.blockState = data.blockState
  store.enemy.lastMines = data.lastMines
  ENEMY_GAME_IS_OVER.value = true
  flower2()
  clearTime2()
  time2.value = data.time
  setTimeout(() => {
    if (play2.value) createMessage(play2.value, { type: 'winning' })
  }, 1000)
}
const gamePlayStartGameCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  setTime2()
}
const gamePlayLeaveCallback = (data: { roomid: string; uuid: string }) => {
  if (data.roomid !== store.roomid || data.uuid !== store.enemy.uuid) return
  enemyOnRoom.value = false
}
onMounted(() => {
  store.ws.socket.on('gamePlayHandler', gamePlayHandlerCallback)
  store.ws.socket.on('gamePlayNewGame', gamePlayNewGameCallback)
  store.ws.socket.on('gamePlayGameOver', gamePlayGameOverCallback)
  store.ws.socket.on('gamePlayWinning', gamePlayWinningCallback)
  store.ws.socket.on('gamePlayStartGame', gamePlayStartGameCallback)
  store.ws.socket.on('gamePlayLeave', gamePlayLeaveCallback)
})

onUnmounted(() => {
  store.ws.socket.off('gamePlayHandler', gamePlayHandlerCallback)
  store.ws.socket.off('gamePlayNewGame', gamePlayNewGameCallback)
  store.ws.socket.off('gamePlayGameOver', gamePlayGameOverCallback)
  store.ws.socket.off('gamePlayWinning', gamePlayWinningCallback)
  store.ws.socket.off('gamePlayStartGame', gamePlayStartGameCallback)
  store.ws.socket.off('gamePlayLeave', gamePlayLeaveCallback)
})

// 时间模块
const time2 = ref('0')
let TIMEID2 = 0
function setTime2() {
  TIMEID2 = setInterval(() => {
    time2.value = (parseFloat(time2.value) + 0.017).toFixed(3)
  }, 17)
}
function clearTime2() {
  clearInterval(TIMEID2)
}

// 撒花
let myCanvas2 = document.createElement('canvas')
onMounted(() => {
  if (!play2.value) return
  myCanvas2.id = 'game-canvas'
  myCanvas2.width = play2.value.clientWidth
  myCanvas2.height = play2.value.clientHeight
  myCanvas2.style.position = 'absolute'
  myCanvas2.style.left = '0'
  myCanvas2.style.top = '0'
  myCanvas2.style.pointerEvents = 'none'
  play2.value.appendChild(myCanvas2)
})
let TIMER2 = setInterval(() => {
  if (!play2.value) return
  myCanvas2.width = play2.value.clientWidth
  myCanvas2.height = play2.value.clientHeight
}, 1000)
onUnmounted(() => {
  if (!play2.value) return
  play2.value.removeChild(myCanvas2)
  clearInterval(TIMER2)
})
let myConfetti2 = confetti.create(myCanvas2, { resize: true })
function flower2() {
  let end = Date.now() + 1 * 1000
  let colors = ['#bb0000', '#ffffff', '#5aa4ae']

  ;(function frame() {
    myConfetti2({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    myConfetti2({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
</script>

<template>
  <div class="multi-game">
    <div ref="play1" class="play1" style="border-right: 1px solid #ccc">
      <div class="leave-room" @click="handleLeaveRoom()">离开房间</div>
      <div class="title">{{ store.username }}</div>
      <div class="chat-box">
        <img :src="store.photo" alt="头像" />
        <div class="chat-value" ref="play1Chat"></div>
        <div class="input-box">
          <input v-model="input" type="text" @keyup.enter="play1HandleChat()" />
          <button @click="play1HandleChat()">发送</button>
        </div>
      </div>
      <div ref="game" class="game">
        <div class="game-header">
          <div style="color: #ffffff; height: 40px; line-height: 40px">Minesweeper</div>
          <div class="mode">
            <button @click="newGame()">重开</button>
          </div>
          <div class="game-data">
            <div>
              <img src="../assets/time.svg" alt="" />
              {{ time }}
            </div>
            <div>
              <img src="../assets/bomb.svg" alt="" />
              {{ lastMines }}
            </div>
          </div>
        </div>
        <div class="game-body">
          <div class="block-row" v-for="(row, y) in blockState" key="y">
            <div
              :class="[
                'block',
                `color${block.adjacentMines}`,
                { mine: block.mine && GAME_IS_OVER && !block.flagged },
                { norevealed: !block.revealed },
              ]"
              v-for="(block, x) in row"
              key="x"
              @contextmenu.prevent="addFlag(x, y)"
              @click="handerBlock(x, y)"
              @dblclick="handerDoubleBlock(y, x)"
            >
              <template v-if="block.revealed">
                <template v-if="block.mine">
                  <img style="width: 17px; height: 17px" src="../assets/bomb.svg" alt="" />
                </template>

                <template v-if="block.adjacentMines !== 0"> {{ block.adjacentMines }} </template>
              </template>
              <template v-else-if="block.flagged">
                <img style="width: 17px; height: 17px" src="../assets/flag.svg" alt="" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div ref="play2" v-if="enemyOnRoom" class="play2" style="border-left: 1px solid #ccc">
      <div class="title">{{ store.enemy.username }}</div>
      <div class="chat-box">
        <img :src="store.enemy.photo" alt="头像" />
        <div class="chat-value" ref="play2Chat"></div>
      </div>
      <div ref="game" class="game">
        <div class="game-header">
          <div style="color: #ffffff; height: 40px; line-height: 40px">Minesweeper</div>
          <div class="mode">
            <button>重开</button>
          </div>
          <div class="game-data">
            <div>
              <img src="../assets/time.svg" alt="" />
              {{ time2 }}
            </div>
            <div>
              <img src="../assets/bomb.svg" alt="" />
              {{ store.enemy.lastMines }}
            </div>
          </div>
        </div>
        <div class="game-body">
          <div class="block-row" v-for="(row, y) in store.enemy.blockState" key="y">
            <div
              :class="[
                'block',
                `color${block.adjacentMines}`,
                { mine: block.mine && ENEMY_GAME_IS_OVER && !block.flagged },
                { norevealed: !block.revealed },
              ]"
              v-for="(block, x) in row"
              key="x"
            >
              <template v-if="block.revealed">
                <template v-if="block.mine">
                  <img style="width: 17px; height: 17px" src="../assets/bomb.svg" alt="" />
                </template>

                <template v-if="block.adjacentMines !== 0"> {{ block.adjacentMines }} </template>
              </template>
              <template v-else-if="block.flagged">
                <img style="width: 17px; height: 17px" src="../assets/flag.svg" alt="" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="play2-leave">用户离开</div>
    </div>
  </div>
</template>

<style scoped>
.multi-game {
  display: flex;
  justify-content: center;
  height: 100%;
}
.multi-game > div {
  height: 100%;
  width: calc(50% - 1px);
  position: relative;
}
.leave-room {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #488f85;
  height: 40px;
  width: 100px;
  text-align: center;
  line-height: 40px;
  border-radius: 7px;
  letter-spacing: 0.1em;
  border: 0;
  outline: none;
  margin: 5px;
  color: #f0f0f0;
  cursor: pointer;
}
.leave-room:active {
  transform: scale(0.9);
}
.title {
  text-align: center;
  color: white;
  font-size: 35px;
  height: 40px;
}
.play1 .chat-box {
  position: absolute;
  height: 200px;
  width: 600px;
  bottom: 0;
  left: 0;
}
.play2 .chat-box {
  position: absolute;
  height: 200px;
  width: 600px;
  bottom: 0;
  right: 0;
}
.chat-box > img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 2px solid #777;
}
.play2 .chat-box img {
  position: absolute;
  right: 0;
}

.input-box {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 360px;
  height: 30px;
}
.input-box > input {
  height: 100%;
  width: 300px;
}
.input-box > button {
  height: 100%;
  width: 60px;
  border: none;
}
.play1 .chat-value {
  position: absolute;
  left: 170px;
  top: 75px;
  min-height: 35px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #108b96;
  color: #fff;
  transform: translate(0%, -50%);
  border-radius: 7px;
  white-space: normal;
  word-break: break-all;
  /* overflow: hidden; */
  display: none;
}
.play1 .chat-value::after {
  content: '';
  height: 20px;
  width: 20px;
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #108b96;
  clip-path: polygon(100% 0, 46% 48%, 100% 100%);
}

.play2 .chat-value {
  position: absolute;
  right: 170px;
  top: 75px;
  min-height: 35px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #108b96;
  color: #fff;
  transform: translate(0%, -50%);
  border-radius: 7px;
  white-space: normal;
  word-break: break-all;
  /* overflow: hidden; */
  display: none;
}
.play2 .chat-value::after {
  content: '';
  height: 20px;
  width: 20px;
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #108b96;
  clip-path: polygon(51% 51%, 0 0, 0 100%);
}

/* game */

button:after {
  border: none;
}
.game {
  /* height: 100%; */
  margin: 0px auto;
  position: relative;
}
.game-header {
  text-align: center;
}
.block-row {
  height: 32px;
  text-align: center;
}

.game-data > div {
  overflow: hidden;
  display: inline-block;
  margin: 0 20px;
  color: #f1f1f1;
  font-size: 20px;
}
.game-data img {
  vertical-align: middle;
  width: 35px;
  height: 35px;
  transform: translateX(200px);
  filter: drop-shadow(#f1f1f1 -200px 0);
}

.norevealed {
  background-color: rgba(140, 140, 140, 0.3);
}
.block {
  width: 30px;
  height: 30px;
  display: inline-block;
  border: 1px solid gray;
  font-size: 17px;
  text-align: center;
  line-height: 30px;
  user-select: none;
  margin: 1px;
  cursor: pointer;
  vertical-align: top;
}
.hide:hover {
  background-color: rgba(140, 140, 140, 0.5);
}
.mine {
  background-color: red;
}

.mode button:active {
  transform: scale(0.98);
}

.mode button {
  background-color: #488f85;
  height: 30px;
  width: 50px;
  border-radius: 7px;
  letter-spacing: 0.1em;
  border: 0;
  outline: none;
  margin: 5px 10px;
  color: #f0f0f0;
}
.color1 {
  --un-text-opacity: 1;
  color: rgba(96, 165, 250, var(--un-text-opacity));
}
.color2 {
  --un-text-opacity: 1;
  color: rgba(74, 222, 128, var(--un-text-opacity));
}
.color3 {
  --un-text-opacity: 1;
  color: rgba(248, 113, 113, var(--un-text-opacity));
}
.color4 {
  --un-text-opacity: 1;
  color: rgba(251, 146, 60, var(--un-text-opacity));
}
.color5 {
  --un-text-opacity: 1;
  color: rgba(244, 114, 182, var(--un-text-opacity));
}
.color6 {
  --un-text-opacity: 1;
  color: rgba(45, 212, 191, var(--un-text-opacity));
}
.color7 {
  color: darkcyan;
}
.color8 {
  color: darkgrey;
}

.play2-leave {
  height: 100%;
  color: #f0f0f0;
  font-size: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
