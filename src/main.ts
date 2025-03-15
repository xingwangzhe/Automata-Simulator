// import './assets/main.css'
import '../node_modules/bulma/css/bulma.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入D3自动机样式和主题工具
import './assets/d3-automata.css'
import { applyThemeColors } from './utils/themeUtils'

// 初始化应用主题
applyThemeColors()

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyThemeColors()
})

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
