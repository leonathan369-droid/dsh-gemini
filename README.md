<div align="center">
  <img src="icon.svg" alt="Gemini Code Assist Plugin for DeepSeek Harness" width="100">

# dsh-gemini

**DeepSeek Harness (DSH) 官方 Gemini 免费多账号接入与实时配额监控插件**

  <img alt="许可证" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square">
  <img alt="零外部依赖" src="https://img.shields.io/badge/dependencies-zero-4b6fff?style=flat-square">
  <img alt="纯原生 ESM" src="https://img.shields.io/badge/build-pure--esm-7da1de?style=flat-square">
  <img alt="平台" src="https://img.shields.io/badge/platform-DeepSeek%20Harness-4285F4?style=flat-square">

</div>

---

### 🌟 项目简介

`dsh-gemini` 是专为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) 打造的 Gemini 深度接入与多账号配额全生命周期管理插件。项目从上游多厂商插件精简拆分，剥离一切无关厂商与体积庞大的二进制 WASM 文件，专注于 **Google Gemini 官方免费接入、多账号无缝故障转移与沉浸式实时配额监控**。

---

### ✨ 核心功能清单

#### 1. 账号全生命周期管理（添加、启闭、删除）
- **一键添加账号 (OAuth 2.0)**：本地自动拉起浏览器进行 Google 官方 OAuth 授权，由本地回调服务自动捕获 Token，零配置接入；
- **账号开启 / 关闭**：在设置界面一键启闭任意账号，状态即时持久化到 `~/.dsh/channel-pack/state.json`；
- **智能主备故障转移**：支持同时接入多个 Google 账号，自动选举主账号；当账号遭遇 `429 RESOURCE_EXHAUSTED` 时，自动进入冷却期并毫秒级无感降级切换至备用账号。

#### 2. 账号连通性测试 (Test & Retest)
- **主动探活**：提供账号测试通道，向 Google 上游发送真实握手验证凭证有效性；
- **冷却检测**：自动感知账号是否处于 429 冷却期，并在恢复后自动解除限流标记。

#### 3. 模型列表与思考强度配置 (Models)
- **多模型支持**：静态与动态模型表完整支持 `gemini-3.8-flash`、`gemini-3.8-pro`、`gemini-2.5-flash`、`gemini-2.5-pro` 等官方模型；
- **思考预算档位**：支持 `low` / `medium` / `high` / `tiered`（自适应）等原生思考强度调节；
- **模型启闭**：支持在模型列表中按需开启或屏蔽特定模型。

#### 4. 沉浸式实时配额监控指示器 (Quota Monitor)
- **输入栏常驻胶囊**：会话输入框模型选择器旁常驻展示当前主账号配额（格式：`5h: XX% ｜ 周: XX%`）；
- **3 列 CSS Grid 精准对齐悬浮卡**：鼠标悬停展开各启用账号详情（账号昵称、`[使用中]` / `[备用]` / `[限流冷却]` 状态徽章、精确到分/小时的重置时间倒计时）；
- **React Fiber 严格隔离**：通过 Fiber 树精确识别会话当前提供商，仅对 Gemini 渠道生效，无缝避开 DeepSeek 原生模型与第三方 API。

---

### 📦 安装与配置

在 DSH 的桌面环境配置 `~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 中引入本插件：

```json
{
  "dependencies": {
    "dsh-gemini": "1.0.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-gemini"
      ]
    }
  }
}
```

并在 `~/.dsh/profiles/desktop/cordis.patch.yml` 中添加（可选）：

```yaml
- id: dsh-gemini
  name: dsh-gemini
```

重启 DeepSeek Harness 即可生效。

---

### 📄 许可证

MIT License.
