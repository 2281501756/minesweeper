import { createApp } from 'vue'
import message from './message.vue'

export const createMessage = (root: HTMLDivElement, props: any) => {
  console.log(props)
  const app = createApp(message, props)
  const div: any = document.createDocumentFragment()
  app.mount(div)
  root.appendChild(div)
}
