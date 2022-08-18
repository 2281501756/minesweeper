<script lang="ts" setup>
import confetti from 'canvas-confetti'
import { ref, onUnmounted, onMounted } from 'vue'
import type { IBlockState } from './type'
import { createMessage } from '../ui/message/index'
import axios from 'axios'
import { useRouter } from '../router'
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
const game = ref<HTMLDivElement>()
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
    console.log('赢了' + time.value)
    if (game.value)
      setTimeout(() => {
        createMessage(game.value as any, { type: 'winning' })
      }, 1000)
    flower()
    axios({
      url: 'https://app464.acapp.acwing.com.cn:20443/mineSweeper/create',
      method: 'post',
      data: {
        user_name: window.user.username,
        photo: window.user.photo,
        time: parseFloat(time.value),
        openid: window.user.openid,
        type: game_mode === mode.easy ? 'easy' : game_mode === mode.med ? 'medium' : 'difficulty',
      },
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
}
const gameover = () => {
  clearTime()
  GAME_IS_OVER.value = true
  for (const row of blockState.value) {
    for (const block of row) {
      if (block.mine) block.revealed = true
    }
  }
  if (game.value) createMessage(game.value, { type: 'lose' })
}
const handerBlock = (x: number, y: number) => {
  if (GAME_IS_OVER.value) return
  if (FIRST_CLICK) {
    placeMines(x, y)
    getAjacentMinesNumber()
    setTime()
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
}

// 模式模块
enum mode {
  easy,
  med,
  diff,
}
let game_mode = mode.easy
function changeMode(T: mode) {
  if (T === mode.easy) {
    HEIGHT = 10
    WIDTH = 10
    COUNT = 10
    game_mode = mode.easy
  } else if (T === mode.med) {
    HEIGHT = 14
    WIDTH = 20
    COUNT = 40
    game_mode = mode.med
  } else if (T === mode.diff) {
    HEIGHT = 16
    WIDTH = 30
    COUNT = 99
    game_mode = mode.diff
  }
  newGame()
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
let dom = document.querySelector('.root') as HTMLDivElement
myCanvas.id = 'game-canvas'
myCanvas.width = dom.clientWidth
myCanvas.height = dom.clientHeight
myCanvas.style.position = 'absolute'
myCanvas.style.left = '0'
myCanvas.style.top = '0'
dom.appendChild(myCanvas)

let TIMER = setInterval(() => {
  myCanvas.width = dom.clientWidth
  myCanvas.height = dom.clientHeight
}, 1000)

onUnmounted(() => {
  dom.removeChild(myCanvas)
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

// router
const { router, setRouter } = useRouter()
const handleHome = () => {
  setRouter('home')
}
</script>

<template>
  <div ref="game" class="game">
    <div class="game-header">
      <div style="color: #ffffff; height: 40px; line-height: 40px">Minesweeper</div>
      <div class="mode">
        <button @click="newGame()">重开</button>
        <button @click="changeMode(mode.easy)">入门</button>
        <button @click="changeMode(mode.med)">大师</button>
        <button @click="changeMode(mode.diff)">专家</button>
        <button @click="handleHome()">首页</button>
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
</template>

<style lang="less" scoped>
button:after {
  border: none;
}
.game {
  height: 100%;
  margin: 0px auto;
  position: relative;
  &-header {
    text-align: center;
  }
}
.block-row {
  height: 32px;
  text-align: center;
}
.game-data {
  & > div {
    overflow: hidden;
    display: inline-block;
    margin: 0 20px;
    color: #f1f1f1;
    font-size: 20px;
  }
  img {
    vertical-align: middle;
    width: 35px;
    height: 35px;
    transform: translateX(200px);
    filter: drop-shadow(#f1f1f1 -200px 0);
  }
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

.mode {
  button {
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
  button:active {
    transform: scale(0.98);
  }
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
</style>
