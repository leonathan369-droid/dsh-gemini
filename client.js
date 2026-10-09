/**
 * dsh-gemini — Browser Half
 * 
 * DeepSeek Harness Native UI Integration:
 * - Dynamic Model Discovery with Live PA Fetch
 * - Dual-Quota Ring & Gauge Monitoring
 * - Multi-Account Enable / Disable Management & Google OAuth Login
 * - Hardware Hash & Anti-Fingerprint Diagnostics
 * - Original DSH Chat Input Quota Box & Tooltip
 */
window.__ModuleLoader__.load({
  id: 'dsh-gemini',
  factory: require => {
    const module = { exports: {} }
    const exports = module.exports
    const React = require('react')
    const { createElement: h, useState, useEffect, useCallback } = React

    const NS = 'settings.dshGemini'
    const inject = ['slots', 'locale']

    // ── dictionary coverage ───────────────────────────────────────────────────
    const DICT = {
      zh: {
        nav: 'Gemini Engine',
        title: 'Gemini Engine',
        statusOk: '运行正常',
        stealthActive: '设备特征指纹已隔离',
        fetchModels: '获取最新模型',
        fetchingModels: '正在探活验证…',
        pingTest: '延迟测速',
        pingTesting: '测试中…',
        pingSuccess: '延迟',
        pingFailed: '测速失败',
        refreshQuota: '刷新配额',
        refreshing: '正在刷新…',
        refreshed: '已更新',
        addAccount: '添加账号',
        addingAccount: '正在调起…',
        quota5h: '5小时配额',
        quotaWeekly: '每星期配额',
        resetAt: '重置于',
        quotaTitle: '额度查看',
        quotaTitleGemini: '额度查看 · Gemini',
        quotaTitleClaude: '额度查看 · Claude',
        switchToClaudeQuota: '切换Claude额度',
        switchToGeminiQuota: '切换Gemini额度',
        accountTitle: '账号管理',
        faqBtn: '常见问题',
        faqTitle: 'Gemini Engine 常见问题与排查指南',
        faqQ1: '为什么新添加账号后显示无配额或不可用？',
        faqA1: '新设备或首次调用 Gemini Code Assist 时，Google 官方安全策略可能会触发「二次验证挑战（HTTP 403: VALIDATION_REQUIRED）」。请在浏览器登录该账号并打开 Google 官方验证页面确认一次，完成后点击 ⟳ 刷新配额即可正常恢复。',
        faqQ2: '主用账号与备用账号的生效规则是什么？',
        faqA2: '系统遵循「先启用的账号为主用，后启用的账号为备用」原则。日常对话优先使用主用账号；当主用账号遭遇 HTTP 429 频控或配额耗尽时，引擎将自动故障转移（Failover）至备用账号。',
        faqQ3: '账号登录凭据会过期吗？如何自动续期？',
        faqA3: 'Google Access Token 有效期约为 1 小时。本插件内置了提前 180 秒的主动静默续期机制，使用 Google OAuth Refresh Token 在后台自动无感换取新 Token，无需反复重新登录。',
        faqQ4: '点击删除账号会彻底清除登录信息吗？',
        faqA4: '会。点击删除并确认后，系统会同时从本地状态表与所有凭据 YAML 文件中物理抹除该账号的全部 Token、密钥与关联信息，达成 0 痕迹彻底清除。',
        faqQ5: '为什么绑定了第二个账号后额度和主账号一样或者刷不出来等显示错误？',
        faqA5: '如果你绑定的第二个账号是先前账号的家庭共享成员，他们共享一个 Google Code 额度，只需添加任意一个账号即可，多余家庭账号会发生未知故障。',
        fetchedModelsCount: '获取了 {n} 个模型',
        fetchModelsFailed: '获取失败',
        accountActive: '主用',
        accountStandby: '备用',
        accountDisabled: '已停用',
        enableAccount: '启用',
        disableAccount: '停用',
        deleteAccount: '删除',
        confirmDelete: '确定彻底删除该账号及所有关联凭据吗？删除后无法恢复。',
        deletingAccount: '正在删除…',
        modelRoster: '可用模型清单',
        modelThinking: '深度思考',
        modelVision: '多模态视觉',
        stealthTitle: '隐蔽指纹防护',
        machineId: '机器指纹',
        sessionId: '会话识别',
      },
      en: {
        nav: 'Gemini Engine',
        title: 'Gemini Engine',
        statusOk: 'Normal',
        stealthActive: 'Hardware Fingerprint Isolated',
        fetchModels: 'Fetch Models',
        fetchingModels: 'Probing Models…',
        pingTest: 'Ping Test',
        pingTesting: 'Pinging…',
        pingSuccess: 'Latency',
        pingFailed: 'Ping Failed',
        refreshQuota: 'Refresh Quota',
        refreshing: 'Refreshing…',
        refreshed: 'Updated',
        addAccount: 'Add Account',
        addingAccount: 'Connecting…',
        quota5h: '5-Hour Quota',
        quotaWeekly: 'Weekly Quota',
        resetAt: 'Resets at',
        quotaTitle: 'Quota Overview',
        quotaTitleGemini: 'Quota Overview · Gemini',
        quotaTitleClaude: 'Quota Overview · Claude',
        switchToClaudeQuota: 'Switch to Claude',
        switchToGeminiQuota: 'Switch to Gemini',
        accountTitle: 'Account Management',
        faqBtn: 'FAQ',
        faqTitle: 'Gemini Engine FAQ & Documentation',
        faqQ1: 'Why does a newly added account show no quota or unavailable?',
        faqA1: 'When calling Gemini Code Assist for the first time or from a new device, Google may trigger a validation challenge (HTTP 403: VALIDATION_REQUIRED). Please log in to the account and confirm the Google validation prompt in your browser, then click ⟳ refresh quota.',
        faqQ2: 'What is the rule for primary and standby accounts?',
        faqA2: 'The engine enforces "first enabled is primary, subsequent enabled are standby". Daily chats prioritize the primary account, and automatically fail over to standby accounts if HTTP 429 rate limits are met.',
        faqQ3: 'Will login credentials expire? How does auto-refresh work?',
        faqA3: 'Google Access Tokens last about 1 hour. This plugin includes a proactive background auto-refresh mechanism (180s buffer) that silently requests fresh tokens using the OAuth refresh token.',
        faqQ4: 'Does clicking delete completely erase all login information?',
        faqA4: 'Yes. Confirming deletion physically purges the account and all associated tokens from state.json and credentials YAML files with zero trace.',
        faqQ5: 'Why does a second account share identical quota or fail to refresh/display properly?',
        faqA5: 'If your second account belongs to the same Google family group as the prior account, they share a single Google Code quota pool. You only need to add one account; redundant family accounts may cause unexpected issues and sync errors.',
        fetchedModelsCount: 'Fetched {n} models',
        fetchModelsFailed: 'Fetch Failed',
        accountActive: 'Primary',
        accountStandby: 'Standby',
        accountDisabled: 'Disabled',
        enableAccount: 'Enable',
        disableAccount: 'Disable',
        deleteAccount: 'Delete',
        confirmDelete: 'Completely delete this account and all associated credentials? This cannot be undone.',
        deletingAccount: 'Deleting…',
        modelRoster: 'Available Models',
        modelThinking: 'Thinking',
        modelVision: 'Vision',
        stealthTitle: 'Stealth Fingerprint Protection',
        machineId: 'Machine ID',
        sessionId: 'Session ID',
      },
    }

    const CSS = `
.dge_container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 4px 48px;
  color: var(--dsw-alias-label-primary, #e0e0e0);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.dge_header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.dge_title_group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dge_title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dsw-alias-label-primary, #ffffff);
}

.dge_badge_group {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.dge_badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
  color: var(--dsw-alias-label-secondary, #b0b0b0);
}
.dge_badge_success {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
  color: #34d399;
}
.dge_badge_disabled {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--dsw-alias-label-tertiary, #777777);
}
.dge_actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dge_btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
  outline: none;
}
.dge_btn_primary {
  background: var(--dsw-alias-state-business-primary, #3b82f6);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.dge_btn_primary:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}
.dge_btn_secondary {
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
  color: var(--dsw-alias-label-primary, #e0e0e0);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
}
.dge_btn_secondary:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.1));
  border-color: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.2));
}

.dge_btn_danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.dge_btn_danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.dge_btn_success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.dge_btn_icon {
  font-size: 13px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dge_btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dge_grid_dual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.dge_card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
}
.dge_card_title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #ffffff);
  line-height: 1.4;
  letter-spacing: 0.2px;
}
.dge_quota_gauge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}
.dge_gauge_bar_bg {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
  overflow: hidden;
  position: relative;
}
.dge_gauge_bar_val {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  transition: width 0.3s ease;
}
.dge_gauge_info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.dge_gauge_percent {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, #ffffff);
  line-height: 1;
}
.dge_gauge_reset {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #858585);
  line-height: 1;
}
.dge_title_sub {
  font-size: 16px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary, #858585);
  margin-left: 8px;
}
.dge_quota_section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dge_account_section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dge_account_list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dge_account_item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.dge_account_meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dge_account_name {
  font-size: 13px;
  font-family: monospace;
  color: var(--dsw-alias-label-primary, #e0e0e0);
}
.dge_account_actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dge_models_section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dge_models_title_wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: var(--dsw-radius-sm, 6px);
  transition: background .15s ease;
}
.dge_models_title_wrap:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.05));
}

.dge_account_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dge_faq_title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #fff);
  margin-bottom: 2px;
}
.dge_faq_card {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
  border-radius: var(--dsw-radius-md, 8px);
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dge_faq_item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dge_faq_q {
  font-weight: 600;
  font-size: 13px;
  color: var(--dsw-alias-label-primary, #fff);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  padding: 4px 6px;
  border-radius: var(--dsw-radius-sm, 6px);
  transition: background .15s ease;
}
.dge_faq_q:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
}
.dge_faq_a {
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary, #b8b8b8);
  padding: 4px 6px 8px 10px;
  border-left: 2px solid var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.15));
  margin: 2px 0 4px 6px;
}

.dge_collapse_icon {
  font-size: 11px;
  color: var(--dsw-alias-label-caption, #888);
  transition: transform .18s ease;
}
.dge_faq_toggle_icon {
  font-size: 10px;
  color: var(--dsw-alias-label-caption, #888);
  margin-left: auto;
  transition: transform .18s ease;
}
.dge_models_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dge_model_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.dge_model_card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
  transition: all 0.18s ease;
}
.dge_model_head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dge_model_name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #ffffff);
}
.dge_model_id {
  font-size: 12px;
  font-family: monospace;
  color: var(--dsw-alias-label-tertiary, #757575);
}
.dge_model_tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dge_model_tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-secondary, #b0b0b0);
}
.dge_stealth_section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dge_stealth_box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.dge_stealth_row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.dge_stealth_label {
  color: var(--dsw-alias-label-secondary, #888888);
}
.dge_stealth_val {
  font-family: monospace;
  color: var(--dsw-alias-label-primary, #cccccc);
}
.dge_svg_spin {
  animation: dgespin 0.75s linear infinite;
}
@keyframes dgespin {
  100% { transform: rotate(360deg); }
}

/* Original DSH Chat Input Quota Box */
.dsh-gemini-quota-box{display:inline-flex;align-items:center;position:relative;height:28px;line-height:20px;font-size:13px;font-weight:400;color:var(--dsw-alias-label-caption,rgba(140,140,140,.85));white-space:nowrap;user-select:none;cursor:pointer;padding:0 4px;margin-right:4px;flex:none;transition:color .15s ease,opacity .2s cubic-bezier(.16,1,.3,1)}
.dsh-gemini-quota-box:hover{color:var(--dsw-alias-label-secondary,#d4d4d4)}
.dsh-gemini-quota-box.is-open{color:var(--dsw-alias-label-secondary,#d4d4d4)}
.dsh-gemini-quota-box.is-loading{opacity:.5}
.dsh-gemini-quota-card{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translate(-50%,6px);background:var(--dsw-specific-menu,var(--dsw-menu-surface-fill,rgba(48,49,54,.94)));backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);color:var(--dsw-alias-label-primary,#fff);padding:10px 14px;border-radius:var(--dsw-radius-lg,10px);font-size:11px;line-height:1.6;white-space:nowrap;box-shadow:var(--dsw-elevation-prominent,0 10px 30px rgba(0,0,0,.45));border:1px solid var(--dsw-elevation-stroke-color,var(--dsw-alias-border-l1,rgba(255,255,255,.1)));pointer-events:none;z-index:99999;opacity:0;visibility:hidden;display:grid;grid-template-columns:max-content max-content auto;column-gap:8px;row-gap:4px;align-items:baseline;font-variant-numeric:tabular-nums;transition:opacity .15s cubic-bezier(.16,1,.3,1),transform .15s cubic-bezier(.16,1,.3,1),visibility .15s}
.dsh-gemini-quota-box.is-open .dsh-gemini-quota-card{opacity:1;visibility:visible;transform:translate(-50%,0);pointer-events:auto}
.dsh-card-refresh{cursor:pointer;opacity:.65;font-size:12px;display:inline-flex;align-items:center;padding:1px 3px;border-radius:3px;transition:opacity .15s ease,transform .15s ease}
.dsh-card-refresh:hover{opacity:1;background:rgba(255,255,255,.1)}
.dsh-card-refresh:active{transform:rotate(90deg)}
.dsh-col-label{color:var(--dsw-alias-label-secondary,#c0c0c0);font-weight:500;white-space:nowrap;letter-spacing:0.2px}
.dsh-col-val{color:var(--dsw-alias-label-primary,#fff);font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}
.dsh-col-reset{color:var(--dsw-alias-label-caption,#999);white-space:nowrap}
.dsh-val-warn{color:var(--dsw-alias-state-warn-label,#faad14)}
.dsh-acct-head{grid-column:span 3;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:1px}
.dsh-acct-sep{grid-column:span 3;border-top:1px solid rgba(255,255,255,.1);margin:4px 0 2px}
.dsh-acct-name{font-weight:500;color:var(--dsw-alias-label-primary,#fff);max-width:320px;overflow:hidden;text-overflow:ellipsis}
.dsh-badge-primary{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(66,133,244,.25);color:#8ab4f8}
.dsh-badge-standby{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,.08);color:var(--dsw-alias-label-caption,#999)}.dsh-badge-disabled{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,.05);color:var(--dsw-alias-label-caption,#777)}
.dsh-badge-warn{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(250,173,20,.2);color:#faad14}
`

    function ensureStyles() {
      if (typeof document === 'undefined') return
      let s = document.getElementById('dsh-gemini-style')
      if (!s) {
        s = document.createElement('style')
        s.id = 'dsh-gemini-style'
        document.head.appendChild(s)
      }
      s.textContent = CSS
    }

    // ── Spinner SVG Helper ───────────────────────────────────────────────────
    function renderSpinner() {
      return h('svg', {
        className: 'dge_svg_spin',
        viewBox: '0 0 16 16',
        width: 14,
        height: 14,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2
      }, h('circle', {
        cx: 8,
        cy: 8,
        r: 6,
        strokeDasharray: 28,
        strokeDashoffset: 10,
        strokeLinecap: 'round'
      }))
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    function formatReset(dateStr) {
      if (!dateStr) return ''
      try {
        const d = new Date(dateStr)
        const diffMs = d.getTime() - Date.now()
        if (diffMs <= 0) return '即将重置'
        const totalHours = Math.floor(diffMs / 3600000)
        const m = Math.floor((diffMs % 3600000) / 60000)
        if (totalHours >= 24) {
          const days = Math.floor(totalHours / 24)
          const remHours = totalHours % 24
          return remHours > 0 ? `${days}天${remHours}小时后` : `${days}天后`
        }
        return totalHours > 0 ? `${totalHours}小时${m}分后` : `${m}分后`
      } catch {
        return ''
      }
    }

    // ── Settings Page Component ───────────────────────────────────────────────
    function SettingsPage(props) {
      const lang = props.locale?.startsWith('zh') ? 'zh' : 'en'
      const t = (k) => {
        const dict = DICT[lang] || DICT.zh
        return dict[k] || DICT.en[k] || k
      }

      const [quota, setQuota] = useState(null)
      const [models, setModels] = useState([])
      const [accounts, setAccounts] = useState([])
      const [stealth, setStealth] = useState(null)
      const [fetching, setFetching] = useState(false)
      const [fetchStatus, setFetchStatus] = useState(null)
      const [showFaq, setShowFaq] = useState(false)
      const [modelsCollapsed, setModelsCollapsed] = useState(false)
      const [openFaq, setOpenFaq] = useState({})
      const toggleFaq = (num) => setOpenFaq(prev => ({ ...prev, [num]: !prev[num] }))
      const [pingMs, setPingMs] = useState(null)
      const [pinging, setPinging] = useState(false)
      const [refreshing, setRefreshing] = useState(false)
      const [justRefreshed, setJustRefreshed] = useState(false)
      const [addingAccount, setAddingAccount] = useState(false)
      const [deletingId, setDeletingId] = useState(null)
      const [quotaPoolIdx, setQuotaPoolIdx] = useState(0)

      const loadQuota = useCallback(async (force = false) => {
        try {
          const res = await window.fetch('/api/gemini/quota', {
            method: force ? 'POST' : 'GET',
            headers: { 'Accept': 'application/json' }
          })
          const data = await res.json()
          if (data?.ok) {
            setQuota(data)
          } else {
            setQuota({
              ok: false,
              enabled: false,
              fiveHour: { percent: 0, resetTime: '' },
              weekly: { percent: 0, resetTime: '' },
              accounts: []
            })
          }
        } catch {
          setQuota(null)
        }
      }, [])

      const loadModels = useCallback(async () => {
        try {
          const res = await window.fetch('/api/gemini/models')
          const data = await res.json()
          if (data?.ok && Array.isArray(data.models)) setModels(data.models)
        } catch {}
      }, [])

      const loadAccounts = useCallback(async () => {
        try {
          const res = await window.fetch('/api/gemini/accounts')
          const data = await res.json()
          if (data?.ok && Array.isArray(data.accounts)) setAccounts(data.accounts)
        } catch {}
      }, [])

      const loadStealth = useCallback(async () => {
        try {
          const res = await window.fetch('/api/gemini/stealth')
          const data = await res.json()
          if (data?.ok) setStealth(data)
        } catch {}
      }, [])

      useEffect(() => {
        ensureStyles()
        loadQuota()
        loadModels()
        loadAccounts()
        loadStealth()
      }, [loadQuota, loadModels, loadAccounts, loadStealth])

      const handleFetchModels = async () => {
        if (fetching) return
        setFetching(true)
        try {
          const res = await window.fetch('/api/gemini/models/fetch', { method: 'POST' })
          const data = await res.json()
          if (data?.ok && Array.isArray(data.models)) {
            setModels(data.models)
            setFetchStatus({ ok: true, count: data.models.length })
          } else {
            setFetchStatus({ ok: false })
          }
        } catch {
          setFetchStatus({ ok: false })
        } finally {
          setFetching(false)
          setTimeout(() => setFetchStatus(null), 3500)
        }
      }

      const handlePing = async () => {
        if (pinging) return
        setPinging(true)
        try {
          const res = await window.fetch('/api/gemini/ping')
          const data = await res.json()
          if (data?.ok && data?.latency !== undefined) setPingMs(data.latency); else setPingMs(-1);
        } catch {} finally {
          setPinging(false)
        }
      }

      const handleRefreshQuota = async () => {
        if (refreshing) return
        setRefreshing(true)
        try {
          await loadQuota(true)
          setJustRefreshed(true)
          setTimeout(() => setJustRefreshed(false), 1400)
        } finally {
          setRefreshing(false)
        }
      }

      const handleAddAccount = async () => {
        if (addingAccount) return
        setAddingAccount(true)
        try {
          const res = await window.fetch('/api/gemini/account/add', { method: 'POST' })
          const data = await res.json()
          if (data?.loginUrl) {
            window.open(data.loginUrl, '_blank')
            // Poll accounts to notice once login completes
            const interval = setInterval(async () => {
              await loadAccounts()
              await loadQuota(true)
            }, 3000)
            setTimeout(() => clearInterval(interval), 60000)
          }
        } catch {} finally {
          setAddingAccount(false)
        }
      }

      const handleToggleAccount = async (id, enabled) => {
        try {
          const res = await window.fetch('/api/gemini/account/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, enabled })
          })
          const data = await res.json()
          if (data?.accounts) setAccounts(data.accounts)
          await loadQuota(true)
          window.dispatchEvent(new CustomEvent('dsh-gemini-quota-sync'))
        } catch {}
      }

      
      const handleDeleteAccount = async (id) => {
        if (!window.confirm(t('confirmDelete'))) return
        setDeletingId(id)
        try {
          const res = await window.fetch('/api/gemini/account/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          })
          const data = await res.json()
          if (data?.ok && Array.isArray(data.accounts)) {
            setAccounts(data.accounts)
          } else {
            await loadAccounts()
          }
          await loadQuota(true)
          window.dispatchEvent(new CustomEvent('dsh-gemini-quota-sync'))
        } catch {} finally {
          setDeletingId(null)
        }
      }

      const quotaPools = [
        {
          id: 'gemini',
          name: 'Gemini',
          title: t('quotaTitleGemini') || '额度查看 · Gemini',
          p5: quota?.fiveHour?.percent ?? 0,
          pW: quota?.weekly?.percent ?? 0,
          r5: quota?.fiveHour?.resetTime,
          rW: quota?.weekly?.resetTime,
          btnLabel: t('switchToClaudeQuota') || '切换Claude额度'
        },
        {
          id: 'thirdParty',
          name: 'Claude',
          title: t('quotaTitleClaude') || '额度查看 · Claude',
          p5: quota?.thirdParty?.fiveHour?.percent ?? (quota?.fiveHour?.percent ?? 99),
          pW: quota?.thirdParty?.weekly?.percent ?? (quota?.weekly?.percent ?? 99),
          r5: quota?.thirdParty?.fiveHour?.resetTime || quota?.fiveHour?.resetTime,
          rW: quota?.thirdParty?.weekly?.resetTime || quota?.weekly?.resetTime,
          btnLabel: t('switchToGeminiQuota') || '切换Gemini额度'
        }
      ]

      const curPool = quotaPools[quotaPoolIdx % 2]
      const p5 = curPool.p5
      const pW = curPool.pW
      const r5 = formatReset(curPool.r5)
      const rW = formatReset(curPool.rW)

      return h('div', { className: 'dge_container' },
        // Header
        h('div', { className: 'dge_header' },
          h('div', { className: 'dge_title_group' },
            h('h2', { className: 'dge_title' }, t('title')),
            h('div', { className: 'dge_badge_group' },
              h('span', { className: 'dge_badge dge_badge_success' }, t('statusOk')),
              h('span', { className: 'dge_badge' }, t('stealthActive'))
            )
          ),
          h('div', { className: 'dge_actions' },
            // Add Account Button
            h('button', {
              className: 'dge_btn dge_btn_primary',
              disabled: addingAccount,
              onClick: handleAddAccount
            },
              addingAccount ? renderSpinner() : h('span', { className: 'dge_btn_icon' }, '+'),
              addingAccount ? t('addingAccount') : t('addAccount')
            ),
            // Ping Latency Button
            h('button', {
              className: 'dge_btn dge_btn_secondary',
              disabled: pinging,
              onClick: handlePing
            },
              pinging ? renderSpinner() : h('span', { className: 'dge_btn_icon' }, '⚡'),
              pinging ? t('pingTesting') : (pingMs !== null ? (pingMs >= 0 ? `${t('pingSuccess')} ${pingMs}ms` : t('pingFailed')) : t('pingTest'))
            ),
            // Refresh Quota Button
            h('button', {
              className: justRefreshed ? 'dge_btn dge_btn_success' : 'dge_btn dge_btn_secondary',
              disabled: refreshing,
              onClick: handleRefreshQuota
            },
              refreshing ? renderSpinner() : (justRefreshed ? h('span', { className: 'dge_btn_icon' }, '✓') : h('span', { className: 'dge_btn_icon' }, '↺')),
              refreshing ? t('refreshing') : (justRefreshed ? t('refreshed') : t('refreshQuota'))
            )
          )
        ),

        // Quota Section (Header matches dge_account_header format and aligns perfectly)
        h('div', { className: 'dge_quota_section' },
          h('div', { className: 'dge_account_header' },
            h('h3', { className: 'dge_title' },
              t('quotaTitle'),
              h('span', { className: 'dge_title_sub' }, curPool.name)
            ),
            h('button', {
              className: 'dge_btn dge_btn_secondary',
              onClick: () => setQuotaPoolIdx(prev => (prev === 0 ? 1 : 0))
            }, curPool.btnLabel)
          ),
          // Dual Quota Gauges
          h('div', { className: 'dge_grid_dual' },
          // 5-Hour Quota Card
          h('div', { className: 'dge_card' },
            h('div', { className: 'dge_card_title' }, t('quota5h')),
            h('div', { className: 'dge_quota_gauge' },
              h('div', { className: 'dge_gauge_info' },
                h('span', { className: 'dge_gauge_percent' }, `${p5}%`),
                r5 ? h('span', { className: 'dge_gauge_reset' }, `${t('resetAt')} ${r5}`) : null
              ),
              h('div', { className: 'dge_gauge_bar_bg' },
                h('div', { className: 'dge_gauge_bar_val', style: { width: `${Math.min(100, Math.max(0, p5))}%` } })
              )
            )
          ),

          // Weekly Quota Card
          h('div', { className: 'dge_card' },
            h('div', { className: 'dge_card_title' }, t('quotaWeekly')),
            h('div', { className: 'dge_quota_gauge' },
              h('div', { className: 'dge_gauge_info' },
                h('span', { className: 'dge_gauge_percent' }, `${pW}%`),
                rW ? h('span', { className: 'dge_gauge_reset' }, `${t('resetAt')} ${rW}`) : null
              ),
              h('div', { className: 'dge_gauge_bar_bg' },
                h('div', { className: 'dge_gauge_bar_val', style: { width: `${Math.min(100, Math.max(0, pW))}%` } })
              )
            )
          )
        )
      ),

        // Account Management List
        h('div', { className: 'dge_account_section' },
          h('div', { className: 'dge_account_header' },
            h('h3', { className: 'dge_title' }, t('accountTitle')),
            h('button', {
              className: 'dge_btn dge_btn_secondary',
              onClick: () => setShowFaq(!showFaq)
            }, t('faqBtn'))
          ),
          showFaq ? h('div', { className: 'dge_faq_card' },
            h('div', { className: 'dge_faq_title' }, t('faqTitle')),
            h('div', { className: 'dge_faq_item' },
              h('div', { className: 'dge_faq_q', onClick: () => toggleFaq(1) },
                h('span', null, 'Q1. ' + t('faqQ1')),
                h('span', { className: 'dge_faq_toggle_icon' }, openFaq[1] ? '▲' : '▼')
              ),
              openFaq[1] ? h('div', { className: 'dge_faq_a' }, t('faqA1')) : null
            ),
            h('div', { className: 'dge_faq_item' },
              h('div', { className: 'dge_faq_q', onClick: () => toggleFaq(2) },
                h('span', null, 'Q2. ' + t('faqQ2')),
                h('span', { className: 'dge_faq_toggle_icon' }, openFaq[2] ? '▲' : '▼')
              ),
              openFaq[2] ? h('div', { className: 'dge_faq_a' }, t('faqA2')) : null
            ),
            h('div', { className: 'dge_faq_item' },
              h('div', { className: 'dge_faq_q', onClick: () => toggleFaq(3) },
                h('span', null, 'Q3. ' + t('faqQ3')),
                h('span', { className: 'dge_faq_toggle_icon' }, openFaq[3] ? '▲' : '▼')
              ),
              openFaq[3] ? h('div', { className: 'dge_faq_a' }, t('faqA3')) : null
            ),
            h('div', { className: 'dge_faq_item' },
              h('div', { className: 'dge_faq_q', onClick: () => toggleFaq(4) },
                h('span', null, 'Q4. ' + t('faqQ4')),
                h('span', { className: 'dge_faq_toggle_icon' }, openFaq[4] ? '▲' : '▼')
              ),
              openFaq[4] ? h('div', { className: 'dge_faq_a' }, t('faqA4')) : null
            ),
            h('div', { className: 'dge_faq_item' },
              h('div', { className: 'dge_faq_q', onClick: () => toggleFaq(5) },
                h('span', null, 'Q5. ' + t('faqQ5')),
                h('span', { className: 'dge_faq_toggle_icon' }, openFaq[5] ? '▲' : '▼')
              ),
              openFaq[5] ? h('div', { className: 'dge_faq_a' }, t('faqA5')) : null
            )
          ) : null,
          h('div', { className: 'dge_account_list' },
            (() => {
              const enabledAccounts = accounts.filter(x => x.enabled);
              const primaryId = enabledAccounts.find(x => x.id === quota?.primaryAccountId)?.id || enabledAccounts[0]?.id;
              return accounts.map(a => {
                const isPrimary = Boolean(a.enabled && a.id === primaryId);
              return h('div', { key: a.id, className: 'dge_account_item' },
                h('div', { className: 'dge_account_meta' },
                  h('span', { className: 'dge_account_name' }, a.nickname || a.id),
                  h('span', {
                    className: !a.enabled ? 'dge_badge dge_badge_disabled' : (isPrimary ? 'dge_badge dge_badge_success' : 'dge_badge')
                  }, !a.enabled ? t('accountDisabled') : (isPrimary ? t('accountActive') : t('accountStandby')))
                ),
                h('div', { className: 'dge_account_actions' },
                  h('button', {
                    className: a.enabled ? 'dge_btn dge_btn_secondary' : 'dge_btn dge_btn_primary',
                    onClick: () => handleToggleAccount(a.id, !a.enabled)
                  }, a.enabled ? t('disableAccount') : t('enableAccount')),
                  h('button', {
                    className: 'dge_btn dge_btn_danger',
                    disabled: deletingId === a.id,
                    onClick: () => handleDeleteAccount(a.id)
                  }, deletingId === a.id ? t('deletingAccount') : t('deleteAccount'))
                )
              )
            })
            })()
          )
        ),

        // Available Models Section (Clean basic information only)
        h('div', { className: 'dge_models_section' },
          h('div', { className: 'dge_models_header' },
            h('div', { className: 'dge_models_title_wrap', onClick: () => setModelsCollapsed(!modelsCollapsed) },
              h('h3', { className: 'dge_title' }, t('modelRoster')),
              h('span', { className: 'dge_collapse_icon' }, modelsCollapsed ? '▶' : '▼')
            ),
            h('button', {
              className: 'dge_btn dge_btn_secondary',
              disabled: fetching,
              onClick: handleFetchModels
            },
              fetching
                ? t('fetchingModels')
                : (fetchStatus
                  ? (fetchStatus.ok
                    ? t('fetchedModelsCount').replace('{n}', String(fetchStatus.count))
                    : t('fetchModelsFailed'))
                  : t('fetchModels'))
            )
          ),
          !modelsCollapsed ? h('div', { className: 'dge_model_grid' },
            models.map(m => h('div', { key: m.id, className: 'dge_model_card' },
              h('div', { className: 'dge_model_head' },
                h('div', { className: 'dge_model_name' }, m.name || m.id),
                h('div', { className: 'dge_model_id' }, m.id)
              ),
              h('div', { className: 'dge_model_tags' },
                m.contextWindow ? h('span', { className: 'dge_model_tag' }, `${Math.round(m.contextWindow / 1024)}k 上下文`) : null,
                m.supportsThinking ? h('span', { className: 'dge_model_tag' }, t('modelThinking')) : null,
                m.supportsImages ? h('span', { className: 'dge_model_tag' }, t('modelVision')) : null,
              )
            ))
          ) : null
        ),

        // Stealth Diagnostics
        h('div', { className: 'dge_stealth_section' },
          h('h3', { className: 'dge_title' }, t('stealthTitle')),
          h('div', { className: 'dge_stealth_box' },
            h('div', { className: 'dge_stealth_row' },
              h('span', { className: 'dge_stealth_label' }, t('machineId')),
              h('span', { className: 'dge_stealth_val' }, stealth?.machineIdHash || '—')
            ),
            h('div', { className: 'dge_stealth_row' },
              h('span', { className: 'dge_stealth_label' }, t('sessionId')),
              h('span', { className: 'dge_stealth_val' }, stealth?.sessionId || '—')
            )
          )
        )
      )
    }

    // ── Original DSH Chat Input Floating Quota Indicator ─────────────────────
    function setupOriginalInputQuotaIndicator() {
      if (typeof document === 'undefined') return

      let quota = (() => {
        try { return JSON.parse(sessionStorage.getItem('dsh_gemini_quota_cache')); } catch { return null; }
      })()
      let loading = false, lastFetch = 0, scheduled = false, rendering = false

      function buildCardHtml(q, is3P = false) {
        if (!q) return ''
        const accs = q.accounts?.length ? q.accounts : [{
          nickname: q.primaryAccount || 'Google 账号',
          isPrimary: true, fiveHour: q.fiveHour, weekly: q.weekly, thirdParty: q.thirdParty
        }]
        const activePrimaryId = accs.find(a => a.enabled !== false && a.id === q.primaryAccountId)?.id || accs.find(a => a.enabled !== false)?.id

        return accs.slice(0, 2).map((a, i) => {
          const isDisabled = a.enabled === false
          const poolData = is3P && (a.thirdParty || q.thirdParty) ? (a.thirdParty || q.thirdParty) : a
          const p5 = isDisabled ? '已停用' : (poolData.fiveHour ? `${poolData.fiveHour.percent}%` : (a.ok === false ? '不可用' : '—'))
          const pW = isDisabled ? '已停用' : (poolData.weekly ? `${poolData.weekly.percent}%` : (a.ok === false ? '不可用' : '—'))
          const r5 = isDisabled ? '' : (poolData.fiveHour ? formatReset(poolData.fiveHour.resetTime) : '')
          const rW = isDisabled ? '' : (poolData.weekly ? formatReset(poolData.weekly.resetTime) : '')
          const isPrimary = !isDisabled && (a.id ? a.id === activePrimaryId : (a.isPrimary ?? i === 0))
          const isLow = !!(!isDisabled && poolData.fiveHour && poolData.fiveHour.percent < 20)
          const poolTag = is3P ? ' [Claude]' : ''
          const badge = isDisabled
            ? '<span class="dsh-badge-disabled">已停用</span>'
            : (isPrimary
              ? `<span class="dsh-badge-primary">使用中${poolTag}</span>`
              : (a.isRateLimited ? '<span class="dsh-badge-warn">限流冷却</span>' : `<span class="dsh-badge-standby">备用${poolTag}</span>`))

          return `
            ${i > 0 ? '<div class="dsh-acct-sep"></div>' : ''}
            <div class="dsh-acct-head"><span class="dsh-acct-name" title="${a.nickname}">${a.nickname}</span><div style="display:flex;align-items:center;gap:6px">${badge}${isPrimary ? '<span class="dsh-card-refresh" title="强制刷新配额">⟳</span>' : ''}</div></div>
            <span class="dsh-col-label">5小时配额：</span><span class="dsh-col-val ${isLow ? 'dsh-val-warn' : ''}">剩余 ${p5}</span><span class="dsh-col-reset">${r5 ? '（' + r5 + '）' : ''}</span>
            <span class="dsh-col-label">每星期配额：</span><span class="dsh-col-val">剩余 ${pW}</span><span class="dsh-col-reset">${rW ? '（' + rW + '）' : ''}</span>
          `
        }).join('')
      }

      async function fetchQuota(force = false) {
        if (loading) return
        const now = Date.now()
        if (!force && quota && now - lastFetch < 5000) return
        loading = true
        const box = document.getElementById('dsh-gemini-quota-indicator')
        if (force && box) box.classList.add('is-loading')
        try {
          const url = force ? '/api/gemini/quota?force=true' : '/api/gemini/quota'
          const res = await window.fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000)
          })
          const data = await res.json().catch(() => null)
          if (data?.ok) {
            quota = data
            lastFetch = Date.now()
            try { sessionStorage.setItem('dsh_gemini_quota_cache', JSON.stringify(data)); } catch {}
          } else if (data && data.enabled === false) {
            quota = data
            try { sessionStorage.removeItem('dsh_gemini_quota_cache'); } catch {}
            const box = document.getElementById('dsh-gemini-quota-indicator')
            if (box) box.style.display = 'none'
          }
        } catch {} finally {
          loading = false
          box?.classList.remove('is-loading')
          render()
        }
      }

      const findAnchor = () =>
        document.querySelector('[data-slot="conversation.input.model"]') ||
        document.querySelector('.conversation-input-model') ||
        document.querySelector('[class*="ModelSelect_root"]') ||
        document.querySelector('button[aria-haspopup="menu"][title*="·"]')

      function getActiveSelection(el) {
        try {
          const target = el?.querySelector?.('button') || el
          const k = Object.keys(target || {}).find(x => x.startsWith('__reactFiber$'))
          if (!k) return null
          let f = target[k]
          while (f) {
            const dir = f.memoizedProps?.directory
            if (dir?.getSnapshot) {
              const s = dir.getSnapshot()
              if (s?.current) return s.current
            }
            const cur = f.memoizedState?.current || f.memoizedProps?.current
            if (cur?.provider) return cur
            f = f.return
          }
        } catch {}
        return null
      }

      function detectActiveModelInfo(el) {
        if (!el) return null
        const sel = getActiveSelection(el)
        const provider = (sel?.provider || '').toLowerCase()
        let modelId = (sel?.model || sel?.id || '').toLowerCase()
        const txt = ((el.textContent || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase()

        if (!modelId) {
          if (txt.includes('claude')) modelId = 'claude-sonnet-4-6'
          else if (txt.includes('gpt')) modelId = 'gpt-oss-120b'
          else if (txt.includes('gemini')) modelId = 'gemini-3.8-flash'
        }

        const isMatched = provider === 'gemini' || txt.includes('claude') || txt.includes('gpt-oss') || txt.includes('gemini')
        if (!isMatched) return null

        const is3P = modelId.includes('claude') || modelId.includes('gpt') || txt.includes('claude') || txt.includes('gpt')
        return { is3P, modelId, isMatched: true }
      }

      function render() {
        if (rendering) return
        rendering = true
        try {
          const anchor = findAnchor()
          let box = document.getElementById('dsh-gemini-quota-indicator')
          if (!anchor) return box?.remove()
          const modelInfo = detectActiveModelInfo(anchor)
          if (!modelInfo || (quota && quota.enabled === false)) return box && (box.style.display = 'none')
          if (!quota) {
            if (box) box.style.display = 'none'
            return fetchQuota()
          }

          const is3P = modelInfo.is3P
          const activePool = is3P && quota.thirdParty ? quota.thirdParty : quota
          const poolPrefix = is3P ? (modelInfo.modelId.includes('gpt') ? 'GPT' : 'Claude') : 'Gemini'

          const p5 = activePool.fiveHour ? `${activePool.fiveHour.percent}%` : '—'
          const pW = activePool.weekly ? `${activePool.weekly.percent}%` : '—'
          const cardHtml = buildCardHtml(quota, is3P)
          const key = `${poolPrefix}_${p5}_${pW}_${cardHtml.length}_${quota.primaryAccountId}`

          if (!box) {
            box = document.createElement('div')
            box.id = 'dsh-gemini-quota-indicator'
            box.className = 'dsh-gemini-quota-box'
            box.setAttribute('role', 'button')
            box.setAttribute('aria-haspopup', 'menu')
            box.setAttribute('aria-expanded', 'false')
            box.innerHTML = `
              <span class="dsh-quota-txt">5h: ${p5} ｜ 周: ${pW}</span>
              <div class="dsh-gemini-quota-card">${cardHtml}</div>`
            box.dataset.renderedKey = key
            box.onclick = async (e) => {
              if (e.target?.closest?.('.dsh-card-refresh')) {
                e.stopPropagation()
                await fetchQuota(true)
                return
              }
              if (e.target?.closest?.('.dsh-gemini-quota-card')) {
                e.stopPropagation()
                return
              }
              e.stopPropagation()
              const willOpen = !box.classList.contains('is-open')
              box.classList.toggle('is-open', willOpen)
              box.setAttribute('aria-expanded', String(willOpen))
              if (willOpen) {
                const now = Date.now()
                if (now - lastFetch > 10000) fetchQuota()
              }
            }
            anchor.insertAdjacentElement('beforebegin', box)
          } else {
            if (box.style.display === 'none') box.style.display = 'inline-flex'
            if (box.nextElementSibling !== anchor) anchor.insertAdjacentElement('beforebegin', box)

            if (box.dataset.renderedKey !== key) {
              box.dataset.renderedKey = key
              const txtEl = box.querySelector('.dsh-quota-txt')
              if (txtEl) txtEl.textContent = `5h: ${p5} ｜ 周: ${pW}`
              const cardEl = box.querySelector('.dsh-gemini-quota-card')
              if (cardEl) {
                cardEl.innerHTML = cardHtml
                const refBtn = cardEl.querySelector('.dsh-card-refresh')
                if (refBtn) {
                  refBtn.onclick = async (ev) => {
                    ev.stopPropagation()
                    await fetchQuota(true)
                  }
                }
              }
            }
          }
        } catch {} finally {
          rendering = false
        }
      }

      const schedule = () => {
        if (scheduled) return
        scheduled = true
        setTimeout(() => { scheduled = false; render(); }, 30)
      }

      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          if (!m.target?.closest?.('#dsh-gemini-quota-indicator')) {
            schedule()
            return
          }
        }
      })
      observer.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['aria-label', 'title', 'class', 'data-slot']
      })

      const fastCheck = setInterval(() => {
        if (document.hidden) return
        const box = document.getElementById('dsh-gemini-quota-indicator')
        const anchor = findAnchor()
        if (anchor && isTargetGemini(anchor) && (!box || !box.isConnected || box.nextElementSibling !== anchor)) {
          render()
        }
      }, 400)

      const poll = setInterval(() => { if (!document.hidden) fetchQuota(); }, 60000)
      const onFocus = () => { if (Date.now() - lastFetch > 30000) fetchQuota(); }
      window.addEventListener('focus', onFocus)
      window.addEventListener('dsh-gemini-quota-sync', () => { fetchQuota(true); })

      // Click outside and Escape handlers to close popover
      document.addEventListener('pointerdown', (e) => {
        const box = document.getElementById('dsh-gemini-quota-indicator')
        if (box && box.classList.contains('is-open') && !box.contains(e.target)) {
          box.classList.remove('is-open')
          box.setAttribute('aria-expanded', 'false')
        }
      })
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const box = document.getElementById('dsh-gemini-quota-indicator')
          if (box && box.classList.contains('is-open')) {
            box.classList.remove('is-open')
            box.setAttribute('aria-expanded', 'false')
          }
        }
      })

      setTimeout(() => { render(); fetchQuota(); }, 50)
    }

    // ── apply ─────────────────────────────────────────────────────────────────
    function apply(ctx) {
      ensureStyles()

      const t = (k) => {
        const dict = DICT[ctx?.locale?.language || 'zh'] || DICT.zh
        return dict[k] || DICT.en[k] || k
      }

      // Register Settings Section
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'dsh-gemini',
        order: 36,
        label: () => t('nav'),
        locale: NS,
      }, props => h(SettingsPage, { ...props, locale: ctx?.locale?.language || 'zh' })))

      // Complete onboarding immediately
      ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
        name: 'settings.onboarding',
        id: 'dsh-gemini-announcement',
        order: -50,
        locale: NS,
      }, props => {
        props?.complete?.()
        return null
      }))

      // Mount original chat input quota indicator
      setupOriginalInputQuotaIndicator()
    }

    exports.apply = apply
    exports.inject = inject
    exports.name = 'dsh-gemini'
    return module.exports
  }
})
