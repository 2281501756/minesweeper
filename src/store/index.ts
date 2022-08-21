import { defineStore } from 'pinia'
import { IBlockState } from '../components/type'
import WS from '../socket'

export const useStore = defineStore('main', {
  state: () => {
    return {
      ws: new WS(),
      username: '',
      photo: '',
      GameStart: false,
      MatchSucceed: false,
      roomid: '',
      roomSeat: 1,
      enemy: {} as {
        uuid: string
        username: string
        photo: string
        roomSeat: number
        prepared: boolean
        blockState: IBlockState[][]
        time: number
        lastMines: number
      },
    }
  },
  actions: {
    chat(v: string) {
      this.ws.socket.emit('chat', {
        uuid: this.ws.id,
        username: this.username,
        photo: this.photo,
        value: v,
      })
    },
    match() {
      this.ws.socket.emit('match', {
        uuid: this.ws.id,
        username: this.username,
        photo: this.photo,
      })
    },
  },
})
