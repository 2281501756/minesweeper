import { defineStore } from 'pinia'
import WS from '../socket'

export const useStore = defineStore('main', {
  state: () => {
    return {
      username: '',
      photo: '',
      ws: new WS(),
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
  },
})
