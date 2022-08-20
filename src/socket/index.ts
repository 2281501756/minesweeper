import { io } from 'socket.io-client'

const url = import.meta.env.DEV
  ? 'https://app464.acapp.acwing.com.cn:20443'
  : 'https://app464.acapp.acwing.com.cn:20443'

export default class WS {
  public socket
  public id: string
  constructor() {
    this.id = this.createID()
    this.socket = io(url)
    this.socket.on('init', (data) => {
      console.log(data)
    })
  }
  createID() {
    let res = ''
    for (let i = 0; i < 12; i++) {
      res += Math.round(Math.random() * 10)
    }
    return res
  }
}
