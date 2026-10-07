<div align="center">
  <img src="icon.svg" alt="Gemini Code Assist Plugin for DeepSeek Harness" width="100">

# dsh-our-free-model (Gemini Dedicated Edition)

**DeepSeek Harness (DSH) 官方 Gemini 免费多账号接入与实时配额监控插件**

  <img alt="许可证" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square">
  <img alt="零外部依赖" src="https://img.shields.io/badge/dependencies-zero-4b6fff?style=flat-square">
  <img alt="纯原生 ESM" src="https://img.shields.io/badge/build-pure--esm-7da1de?style=flat-square">
  <img alt="平台" src="https://img.shields.io/badge/platform-DeepSeek%20Harness-4285F4?style=flat-square">

</div>

---

### 🌟 项目简介

本项目是从 [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) 精简并深度重构的 **Gemini 专精版本**，剥离了原仓库中其余 12 家厂商渠道与大型二进制 WASM 资产，并深度集成了 **Gemini 实时配额监控与多账号调度组件**。

### ✨ 核心特性

1. **Google OAuth 2.0 原生一键授权**
   - 本地自动拉起浏览器进行官方授权回调，自动换取并刷新凭据，无需手动抓取 Cookie 或 API Key。
2. **多账号池与智能故障转移 (Failover)**
   - 动态识别并支持挂载多个 Google 账号；
   - 自动选举可用主账号，当单账号遭遇 `429 RESOURCE_EXHAUSTED` 限流时，自动记录冷却期并毫秒级无感切换至备用账号。
3. **沉浸式实时配额监控指示器**
   - **输入栏常驻胶囊**：会话输入框模型选择器旁常驻显示当前主账号配额（`5h: XX% ｜ 周: XX%`）；
   - **CSS Grid 3 列对齐悬浮卡**：鼠标悬停展开各启用账号详情，包含账号昵称、状态徽章（`[使用中]` / `[备用]` / `[限流冷却]`）与精确到分/小时的刷新倒计时；
   - **React Fiber 严格隔离**：智能校验当前会话模型，切换至非 Gemini 渠道模型时自动安全隐藏。
4. **极致轻量、零外部依赖**
   - 移除原版 300KB WASM、多厂商冗余文件及 EAC 代理，代码纯净，CPU 负载 < 0.5%。

---

### 📦 安装与配置

在 DSH 的桌面环境配置 `~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 中引入本插件：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-our-free-model"
      ]
    }
  }
}
```

重启 DeepSeek Harness 即可生效。

---

### 📄 许可证

MIT License.
