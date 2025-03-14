# Automata Simulator（自动机模拟器）

<div align="center">
  <img src="./public/logo.png" alt="自动机模拟器Logo" width="200" />
  <h3>可视化自动机学习与模拟工具</h3>
  <p>
    <em>由GitHub Copilot协助开发</em>
  </p>
</div>

## 📝 项目简介

Automata Simulator是一个用于学习和可视化有限自动机(FA)的Web应用，支持NFA（非确定性有限自动机）和DFA（确定性有限自动机）的可视化、构建和模拟。该工具可以根据正则表达式生成对应的自动机图，并提供交互式的模拟功能，帮助用户理解自动机的工作原理。

> 🤖 **注意：** 本项目在开发过程中大量使用了**GitHub Copilot**人工智能辅助编码。Copilot不仅帮助加速了开发过程，还提供了许多关于自动机理论实现的见解和优化建议。

## ✨ 主要功能

- 🔄 支持NFA和DFA两种自动机类型的切换和可视化
- ⚙️ 根据正则表达式自动生成对应的自动机图
- 🔍 支持通过输入字符串进行自动机模拟
- 🎬 逐步展示自动机运行过程，包括状态转换
- 📊 直观的图形化界面，展示状态和转换
- 📱 响应式设计，适配不同设备

## 🚀 技术栈

- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **UI框架**: Bulma CSS
- **图表可视化**: ECharts
- **构建工具**: Vite
- **编程语言**: TypeScript

## 🛠️ 安装与使用

```bash
# 克隆项目
git clone https://github.com/xingwangzhe/Automata-Simulator.git

# 进入项目目录
cd Automata-Simulator

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📖 使用指南

1. **生成自动机**：

   - 在输入框中输入正则表达式
   - 点击"生成自动机"按钮
   - 在视图区域查看生成的NFA或DFA图形

2. **模拟自动机**：

   - 输入测试字符串
   - 点击"开始模拟"按钮
   - 使用"上一步"和"下一步"按钮观察状态转换
   - 查看自动机是否接受该字符串

3. **图形交互**：
   - 拖拽：移动节点位置
   - 鼠标滚轮：缩放图表
   - 双击：重置视图
   - 点击节点：查看详细状态信息

## 💡 GitHub Copilot 的贡献

本项目是在GitHub Copilot的辅助下开发的，AI对项目的帮助主要体现在以下方面：

- **算法实现**：Copilot帮助实现了复杂的自动机转换算法，如正则表达式到NFA的转换、NFA到DFA的子集构造算法
- **图形可视化**：提供了ECharts配置的优化建议，特别是解决了自环和多重转换边的显示问题
- **代码重构**：识别代码中可改进的模式，建议更优雅的实现方式
- **UI组件设计**：生成了初始UI组件结构，并提供了样式优化建议
- **类型定义**：帮助定义TypeScript接口和类型，提高代码的健壮性
- **BUG修复**：快速识别潜在问题并提供修复方案

> Copilot的建议经过了人工审查和调整，确保代码质量和正确性。

## 🤝 贡献指南

欢迎为Automata Simulator做出贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建您的特性分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m '添加了一些很棒的特性'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交拉取请求

## 📜 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">
  <p>使用 ❤️ 和 GitHub Copilot 开发</p>
  :)
</div>
