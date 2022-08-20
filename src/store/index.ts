import { defineStore } from 'pinia'
import WS from '../socket'

export const useStore = defineStore('main', {
  state: () => {
    return {
      ws: new WS(),
      username: '',
      photo: '',
      MatchSucceed: false,
      roomid: '',
      roomSeat: 1,
      enemy: {} as {
        uuid?: string
        username?: string
        photo?: string
        roomSeat?: number
        prepared?: boolean
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
