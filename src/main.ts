import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'

// import { login } from './util/login'

createApp(App).use(createPinia()).mount('#app')
// login()
