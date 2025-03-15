// import './assets/main.css'
import '../node_modules/bulma/css/bulma.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入D3自动机样式
import './assets/d3-automata.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
