import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'

import { login } from './util/login'

const a = async () => {
  await login()
  createApp(App).use(createPinia()).mount('#app')
}
a()
