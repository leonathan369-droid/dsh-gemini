---
name: dsh-plugin-tester
description: >-
  用于 DeepSeek Harness (DSH) 插件（dsh-gemini 与原版 dsh-our-free-model / dsh-gemini-quota）的重装测试、版本平替切换、进程重载与在线/离线健康冒烟。在用户要求重装、测试、切换开发版/稳定版插件或核验配额端点时使用。
---

# DeepSeek Harness (DSH) 插件重装与测试指南

本 Skill 专门服务于 DSH 插件本地开发与平替测试，提供在开发版 (`dsh-gemini`) 与稳定版 (`dsh-our-free-model` + `dsh-gemini-quota`) 之间**一键无损切换、优雅重启 DSH 以及冒烟核验**的标准化工作流。

## 核心脚本工具

项目内置自动化管理脚本：
`node /Users/leo_nathan/.dsh/dsh-gemini/scripts/dsh-plugin-manager.mjs <action> [target]`

---

## 常用操作工作流

### 1. 查看当前插件与运行状态
检查当前 DSH 挂载的是开发版还是稳定版，以及宿主 PID、监听端口与配额接口：
```bash
node /Users/leo_nathan/.dsh/dsh-gemini/scripts/dsh-plugin-manager.mjs status
```

### 2. 切换为开发测试版 (`dsh-gemini`)
将 DSH 运行环境平替为正在研发的独立 `dsh-gemini` 插件：
```bash
node /Users/leo_nathan/.dsh/dsh-gemini/scripts/dsh-plugin-manager.mjs switch dev
```
*执行效果*：
- 自动备份 `~/.dsh/profiles/desktop/package.json`；
- 替换依赖与 bundles 为 `dsh-gemini`；
- 建立软链接直连本地源码；
- 优雅重启 DSH 客户端并自动检测端口连通性。

### 3. 一键还原为原版稳定运行态 (`dsh-our-free-model` + `dsh-gemini-quota`)
在测试结束或需要回滚到稳定状态时执行：
```bash
node /Users/leo_nathan/.dsh/dsh-gemini/scripts/dsh-plugin-manager.mjs switch stable
```
*执行效果*：
- 恢复原有双插件依赖声明与 bundles 注册；
- 还原 `node_modules` 真实包实体；
- 重启 DSH 并验证端点。

### 4. 运行完整代码与语法冒烟测试
对 `dsh-gemini` 本地源码运行全套静态代码检查与离线/在线集成测试：
```bash
node /Users/leo_nathan/.dsh/dsh-gemini/scripts/dsh-plugin-manager.mjs test
```
*校验项包含*：
1. `client-lint`: UI 字典 404 项 key 匹配、140 条 CSS 样式规则与模块 ID 正确性；
2. `sanitize`: 32 项 HTML 安全转义与防 XSS 注入测试；
3. `gemini-quota`: 账户列表读取与 Google Cloud Code 实时配额 API 测试。

---

## 验证与验收准则 (Verification Checklist)
1. **状态响应**：`curl -s http://127.0.0.1:19387/api/gemini-quota` 必须返回 `ok: true`；
2. **崩溃检查**：`/Users/leo_nathan/Library/Logs/DeepSeek Harness/` 下无新增 crash 日志；
3. **凭据安全**：切换全程不得改动 `~/.dsh/channel-pack/` 下的 `state.json` 与 `gemini-sigs.json`，确保登录状态 100% 留存。
