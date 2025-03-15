/**
 * 主题工具类 - 用于处理Bulma主题及颜色
 */

// 获取当前系统主题（明亮/暗黑）
export function getSystemTheme(): 'light' | 'dark' {
  // 判断系统是否支持暗色模式检测
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// 获取与Bulma兼容的主题颜色
export function getBulmaColors(theme: 'light' | 'dark' = getSystemTheme()) {
  const isDarkTheme = theme === 'dark'

  return {
    // 基础颜色
    background: isDarkTheme ? '#121212' : '#f5f5f5', // 背景色
    text: isDarkTheme ? '#f5f5f5' : '#363636', // 文本颜色
    border: isDarkTheme ? '#4a4a4a' : '#dbdbdb', // 边框颜色

    // 强调色
    primary: isDarkTheme ? '#00e8c6' : '#00d1b2', // 主要颜色（青色）
    info: isDarkTheme ? '#48c5ff' : '#3e8ed0', // 信息色（蓝色）
    success: isDarkTheme ? '#8dd879' : '#48c78e', // 成功色（绿色）
    warning: isDarkTheme ? '#ffd83d' : '#ffdd57', // 警告色（黄色）
    danger: isDarkTheme ? '#ff6b6b' : '#f14668', // 危险色（红色）

    // 链接颜色
    link: isDarkTheme ? '#5e9eff' : '#485fc7', // 链接色（紫蓝色）

    // 图表专用颜色
    chartNode: isDarkTheme ? '#5470c6' : '#5470c6', // 节点颜色
    chartAccepting: isDarkTheme ? '#91cc75' : '#91cc75', // 接受节点颜色
    chartEdge: isDarkTheme ? '#00e8c6' : '#00d1b2', // 边颜色
    chartSelfLoop: isDarkTheme ? '#ffd83d' : '#ffdd57', // 自环颜色
    chartHighlight: isDarkTheme ? '#ff9900' : '#ff9900', // 高亮颜色
  }
}

// 将颜色应用于CSS变量
export function applyThemeColors() {
  const colors = getBulmaColors()
  document.documentElement.style.setProperty('--chart-bg', colors.background)
  document.documentElement.style.setProperty('--link-color', colors.chartEdge)
  document.documentElement.style.setProperty('--self-loop-color', colors.chartSelfLoop)
  document.documentElement.style.setProperty('--arrow-color', colors.chartEdge)
  document.documentElement.style.setProperty('--tooltip-background', colors.background)
  document.documentElement.style.setProperty('--tooltip-color', colors.text)
  document.documentElement.style.setProperty('--tooltip-border', colors.border)
  document.documentElement.style.setProperty('--label-bg', colors.background)
  document.documentElement.style.setProperty('--label-border', colors.border)
  document.documentElement.style.setProperty('--label-text', colors.text)
  document.documentElement.style.setProperty(
    '--self-loop-label-bg',
    getSystemTheme() === 'dark' ? '#4a3b00' : '#fff8e1',
  )
}
