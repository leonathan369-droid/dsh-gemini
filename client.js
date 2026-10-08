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

    const NS = 'settings.ourFreeModel'
    const inject = ['slots', 'locale']

    // ── dictionary coverage ───────────────────────────────────────────────────
    const DICT = {
      zh: {
        nav: 'Gemini 引擎',
        title: 'Google Gemini 引擎',
        subtitle: 'Google Cloud Code PA 官方免费通道 · 真实思考预算 · 实时双配额与故障转移',
        statusOk: '运行正常',
        stealthActive: '设备特征指纹已隔离',
        fetchModels: '获取最新模型',
        fetchingModels: '正在拉取…',
        pingTest: '延迟测速',
        pingTesting: '测试中…',
        pingSuccess: '延迟',
        refreshQuota: '刷新配额',
        refreshing: '正在刷新…',
        refreshed: '已更新',
        addAccount: '添加账号',
        addingAccount: '正在调起…',
        quota5h: '5小时配额',
        quotaWeekly: '周总配额',
        resetAt: '重置于',
        accountTitle: '账号管理',
        accountActive: '主用',
        accountStandby: '备用',
        accountDisabled: '已停用',
        enableAccount: '启用',
        disableAccount: '停用',
        deleteAccount: '删除',
        confirmDelete: '确定彻底删除该账号及所有关联凭据吗？删除后无法恢复。',
        deletingAccount: '正在删除…',
        modelRoster: '可用模型清单',
        modelCount: '已发现可用模型',
        modelThinking: '深度思考',
        modelVision: '多模态视觉',
        modelRecommended: '官方推荐',
        stealthTitle: '隐蔽指纹防护',
        machineId: '机器指纹',
        sessionId: '会话识别',
      },
      en: {
        nav: 'Gemini Engine',
        title: 'Google Gemini Engine',
        subtitle: 'Google Cloud Code PA Official Route · Real Thinking Budget · Real-time Dual Quota',
        statusOk: 'Normal',
        stealthActive: 'Hardware Fingerprint Isolated',
        fetchModels: 'Fetch Models',
        fetchingModels: 'Fetching…',
        pingTest: 'Ping Test',
        pingTesting: 'Pinging…',
        pingSuccess: 'Latency',
        refreshQuota: 'Refresh Quota',
        refreshing: 'Refreshing…',
        refreshed: 'Updated',
        addAccount: 'Add Account',
        addingAccount: 'Connecting…',
        quota5h: '5-Hour Quota',
        quotaWeekly: 'Weekly Quota',
        resetAt: 'Resets at',
        accountTitle: 'Account Management',
        accountActive: 'Primary',
        accountStandby: 'Standby',
        accountDisabled: 'Disabled',
        enableAccount: 'Enable',
        disableAccount: 'Disable',
        deleteAccount: 'Delete',
        confirmDelete: 'Completely delete this account and all associated credentials? This cannot be undone.',
        deletingAccount: 'Deleting…',
        modelRoster: 'Available Models',
        modelCount: 'Available models discovered',
        modelThinking: 'Thinking',
        modelVision: 'Vision',
        modelRecommended: 'Recommended',
        stealthTitle: 'Stealth Fingerprint Protection',
        machineId: 'Machine ID',
        sessionId: 'Session ID',
      },
    }

    const CSS = `
.ofm_container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 4px 48px;
  color: var(--dsw-alias-label-primary, #e0e0e0);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.ofm_header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.ofm_title_group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ofm_title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dsw-alias-label-primary, #ffffff);
}
.ofm_subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary, #9e9e9e);
  line-height: 1.5;
}
.ofm_badge_group {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.ofm_badge {
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
.ofm_badge_success {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
  color: #34d399;
}
.ofm_badge_disabled {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--dsw-alias-label-tertiary, #777777);
}
.ofm_actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ofm_btn {
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
.ofm_btn_primary {
  background: var(--dsw-alias-state-business-primary, #3b82f6);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.ofm_btn_primary:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}
.ofm_btn_secondary {
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
  color: var(--dsw-alias-label-primary, #e0e0e0);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
}
.ofm_btn_secondary:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.1));
  border-color: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.2));
}

.ofm_btn_danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.ofm_btn_danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.ofm_btn_success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.ofm_btn_icon {
  font-size: 13px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ofm_btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.ofm_grid_dual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.ofm_card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.ofm_card_title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #ffffff);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ofm_card_desc {
  margin: 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #9e9e9e);
}
.ofm_quota_gauge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.ofm_gauge_bar_bg {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
  overflow: hidden;
  position: relative;
}
.ofm_gauge_bar_val {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  transition: width 0.3s ease;
}
.ofm_gauge_info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
}
.ofm_gauge_percent {
  font-size: 16px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #ffffff);
}
.ofm_gauge_reset {
  color: var(--dsw-alias-label-tertiary, #757575);
}
.ofm_account_section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ofm_account_list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ofm_account_item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.ofm_account_meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ofm_account_name {
  font-size: 13px;
  font-family: monospace;
  color: var(--dsw-alias-label-primary, #e0e0e0);
}
.ofm_account_actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ofm_models_section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ofm_models_header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.ofm_models_count {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #757575);
}
.ofm_model_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.ofm_model_card {
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
.ofm_model_head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ofm_model_name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #ffffff);
}
.ofm_model_id {
  font-size: 12px;
  font-family: monospace;
  color: var(--dsw-alias-label-tertiary, #757575);
}
.ofm_model_tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ofm_model_tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-secondary, #b0b0b0);
}
.ofm_stealth_section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ofm_stealth_box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.ofm_stealth_row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.ofm_stealth_label {
  color: var(--dsw-alias-label-secondary, #888888);
}
.ofm_stealth_val {
  font-family: monospace;
  color: var(--dsw-alias-label-primary, #cccccc);
}
.ofm_svg_spin {
  animation: ofmspin 0.75s linear infinite;
}
@keyframes ofmspin {
  100% { transform: rotate(360deg); }
}

/* Original DSH Chat Input Quota Box */
.dsh-gemini-quota-box{display:inline-flex;align-items:center;position:relative;height:28px;line-height:20px;font-size:13px;font-weight:400;color:var(--dsw-alias-label-caption,rgba(140,140,140,.85));white-space:nowrap;user-select:none;cursor:pointer;padding:0 4px;margin-right:4px;flex:none;transition:color .15s ease,opacity .2s cubic-bezier(.16,1,.3,1)}
.dsh-gemini-quota-box:hover{color:var(--dsw-alias-label-secondary,#d4d4d4)}
.dsh-gemini-quota-box.is-loading{opacity:.5}
.dsh-gemini-quota-card{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translate(-50%,6px);background:var(--dsw-alias-tooltip-bg,#272730);color:var(--dsw-alias-toast-label,#fff);padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.14);pointer-events:none;z-index:99999;opacity:0;visibility:hidden;display:grid;grid-template-columns:auto auto auto;column-gap:8px;row-gap:3px;align-items:center;font-variant-numeric:tabular-nums;transition:opacity .15s cubic-bezier(.16,1,.3,1),transform .15s cubic-bezier(.16,1,.3,1),visibility .15s}
.dsh-gemini-quota-box:hover .dsh-gemini-quota-card{opacity:1;visibility:visible;transform:translate(-50%,0)}
.dsh-col-label{color:var(--dsw-alias-label-secondary,#c0c0c0);font-weight:500}
.dsh-col-val{color:var(--dsw-alias-label-primary,#fff);font-weight:500}
.dsh-col-reset{color:var(--dsw-alias-label-caption,#999)}
.dsh-val-warn{color:var(--dsw-alias-state-warn-label,#faad14)}
.dsh-acct-head{grid-column:span 3;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:1px}
.dsh-acct-sep{grid-column:span 3;border-top:1px solid rgba(255,255,255,.1);margin:4px 0 2px}
.dsh-acct-name{font-weight:500;color:var(--dsw-alias-label-primary,#fff);max-width:220px;overflow:hidden;text-overflow:ellipsis}
.dsh-badge-primary{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(66,133,244,.25);color:#8ab4f8}
.dsh-badge-standby{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,.08);color:var(--dsw-alias-label-caption,#999)}
.dsh-badge-warn{font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(250,173,20,.2);color:#faad14}
`

    function ensureStyles() {
      if (typeof document === 'undefined') return
      if (document.getElementById('dsh-gemini-style')) return
      const s = document.createElement('style')
      s.id = 'dsh-gemini-style'
      s.textContent = CSS
      document.head.appendChild(s)
    }

    // ── Spinner SVG Helper ───────────────────────────────────────────────────
    function renderSpinner() {
      return h('svg', {
        className: 'ofm_svg_spin',
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
        const h = Math.floor(diffMs / 3600000)
        const m = Math.floor((diffMs % 3600000) / 60000)
        return h > 0 ? `${h}时${m}分后` : `${m}分后`
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
      const [pingMs, setPingMs] = useState(null)
      const [pinging, setPinging] = useState(false)
      const [refreshing, setRefreshing] = useState(false)
      const [justRefreshed, setJustRefreshed] = useState(false)
      const [addingAccount, setAddingAccount] = useState(false)
      const [deletingId, setDeletingId] = useState(null)

      const loadQuota = useCallback(async (force = false) => {
        try {
          const res = await window.fetch('/api/gemini/quota', {
            method: force ? 'POST' : 'GET',
            headers: { 'Accept': 'application/json' }
          })
          const data = await res.json()
          if (data?.ok) setQuota(data)
        } catch {}
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
          }
        } catch {} finally {
          setFetching(false)
        }
      }

      const handlePing = async () => {
        if (pinging) return
        setPinging(true)
        try {
          const res = await window.fetch('/api/gemini/ping')
          const data = await res.json()
          if (data?.latency !== undefined) setPingMs(data.latency)
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
        } catch {} finally {
          setDeletingId(null)
        }
      }

      const p5 = quota?.fiveHour?.percent ?? 0
      const pW = quota?.weekly?.percent ?? 0
      const r5 = formatReset(quota?.fiveHour?.resetTime)
      const rW = formatReset(quota?.weekly?.resetTime)

      return h('div', { className: 'ofm_container' },
        // Header
        h('div', { className: 'ofm_header' },
          h('div', { className: 'ofm_title_group' },
            h('h2', { className: 'ofm_title' }, t('title')),
            h('p', { className: 'ofm_subtitle' }, t('subtitle')),
            h('div', { className: 'ofm_badge_group' },
              h('span', { className: 'ofm_badge ofm_badge_success' }, t('statusOk')),
              h('span', { className: 'ofm_badge' }, t('stealthActive'))
            )
          ),
          h('div', { className: 'ofm_actions' },
            // Add Account Button
            h('button', {
              className: 'ofm_btn ofm_btn_primary',
              disabled: addingAccount,
              onClick: handleAddAccount
            },
              addingAccount ? renderSpinner() : h('span', { className: 'ofm_btn_icon' }, '+'),
              addingAccount ? t('addingAccount') : t('addAccount')
            ),
            // Fetch Models Button
            h('button', {
              className: 'ofm_btn ofm_btn_secondary',
              disabled: fetching,
              onClick: handleFetchModels
            },
              fetching ? renderSpinner() : h('span', { className: 'ofm_btn_icon' }, '⟳'),
              fetching ? t('fetchingModels') : t('fetchModels')
            ),
            // Ping Latency Button
            h('button', {
              className: 'ofm_btn ofm_btn_secondary',
              disabled: pinging,
              onClick: handlePing
            },
              pinging ? renderSpinner() : h('span', { className: 'ofm_btn_icon' }, '⚡'),
              pinging ? t('pingTesting') : (pingMs !== null ? `${t('pingSuccess')} ${pingMs}ms` : t('pingTest'))
            ),
            // Refresh Quota Button
            h('button', {
              className: justRefreshed ? 'ofm_btn ofm_btn_success' : 'ofm_btn ofm_btn_secondary',
              disabled: refreshing,
              onClick: handleRefreshQuota
            },
              refreshing ? renderSpinner() : (justRefreshed ? h('span', { className: 'ofm_btn_icon' }, '✓') : h('span', { className: 'ofm_btn_icon' }, '↺')),
              refreshing ? t('refreshing') : (justRefreshed ? t('refreshed') : t('refreshQuota'))
            )
          )
        ),

        // Dual Quota Gauges
        h('div', { className: 'ofm_grid_dual' },
          // 5-Hour Quota Card
          h('div', { className: 'ofm_card' },
            h('div', { className: 'ofm_card_title' },
              t('quota5h'),
              h('span', { className: 'ofm_badge' }, '滚动周期')
            ),
            h('div', { className: 'ofm_quota_gauge' },
              h('div', { className: 'ofm_gauge_info' },
                h('span', { className: 'ofm_gauge_percent' }, `${p5}%`),
                r5 ? h('span', { className: 'ofm_gauge_reset' }, `${t('resetAt')} ${r5}`) : null
              ),
              h('div', { className: 'ofm_gauge_bar_bg' },
                h('div', { className: 'ofm_gauge_bar_val', style: { width: `${Math.min(100, Math.max(0, p5))}%` } })
              )
            ),
            h('p', { className: 'ofm_card_desc' }, '每 5 小时动态重置的高频推理配额')
          ),

          // Weekly Quota Card
          h('div', { className: 'ofm_card' },
            h('div', { className: 'ofm_card_title' },
              t('quotaWeekly'),
              h('span', { className: 'ofm_badge' }, '7天周期')
            ),
            h('div', { className: 'ofm_quota_gauge' },
              h('div', { className: 'ofm_gauge_info' },
                h('span', { className: 'ofm_gauge_percent' }, `${pW}%`),
                rW ? h('span', { className: 'ofm_gauge_reset' }, `${t('resetAt')} ${rW}`) : null
              ),
              h('div', { className: 'ofm_gauge_bar_bg' },
                h('div', { className: 'ofm_gauge_bar_val', style: { width: `${Math.min(100, Math.max(0, pW))}%` } })
              )
            ),
            h('p', { className: 'ofm_card_desc' }, '账号每周总可用容量预算')
          )
        ),

        // Account Management List
        h('div', { className: 'ofm_account_section' },
          h('h3', { className: 'ofm_title' }, t('accountTitle')),
          h('div', { className: 'ofm_account_list' },
            accounts.map((a, idx) => {
              const isPrimary = a.id === quota?.primaryAccountId || idx === 0
              return h('div', { key: a.id, className: 'ofm_account_item' },
                h('div', { className: 'ofm_account_meta' },
                  h('span', { className: 'ofm_account_name' }, a.nickname || a.id),
                  h('span', {
                    className: !a.enabled ? 'ofm_badge ofm_badge_disabled' : (isPrimary ? 'ofm_badge ofm_badge_success' : 'ofm_badge')
                  }, !a.enabled ? t('accountDisabled') : (isPrimary ? t('accountActive') : t('accountStandby')))
                ),
                h('div', { className: 'ofm_account_actions' },
                  h('button', {
                    className: a.enabled ? 'ofm_btn ofm_btn_secondary' : 'ofm_btn ofm_btn_primary',
                    onClick: () => handleToggleAccount(a.id, !a.enabled)
                  }, a.enabled ? t('disableAccount') : t('enableAccount')),
                  h('button', {
                    className: 'ofm_btn ofm_btn_danger',
                    disabled: deletingId === a.id,
                    onClick: () => handleDeleteAccount(a.id)
                  }, deletingId === a.id ? t('deletingAccount') : t('deleteAccount'))
                )
              )
            })
          )
        ),

        // Available Models Section (Clean basic information only)
        h('div', { className: 'ofm_models_section' },
          h('div', { className: 'ofm_models_header' },
            h('h3', { className: 'ofm_title' }, t('modelRoster')),
            h('span', { className: 'ofm_models_count' }, `${t('modelCount')} (${models.length})`)
          ),
          h('div', { className: 'ofm_model_grid' },
            models.map(m => h('div', { key: m.id, className: 'ofm_model_card' },
              h('div', { className: 'ofm_model_head' },
                h('div', { className: 'ofm_model_name' }, m.name || m.id),
                h('div', { className: 'ofm_model_id' }, m.id)
              ),
              h('div', { className: 'ofm_model_tags' },
                m.contextWindow ? h('span', { className: 'ofm_model_tag' }, `${Math.round(m.contextWindow / 1024)}k 上下文`) : null,
                m.supportsThinking ? h('span', { className: 'ofm_model_tag' }, t('modelThinking')) : null,
                m.supportsImages ? h('span', { className: 'ofm_model_tag' }, t('modelVision')) : null,
                m.recommended ? h('span', { className: 'ofm_model_tag' }, t('modelRecommended')) : null
              )
            ))
          )
        ),

        // Stealth Diagnostics
        h('div', { className: 'ofm_stealth_section' },
          h('h3', { className: 'ofm_title' }, t('stealthTitle')),
          h('div', { className: 'ofm_stealth_box' },
            h('div', { className: 'ofm_stealth_row' },
              h('span', { className: 'ofm_stealth_label' }, t('machineId')),
              h('span', { className: 'ofm_stealth_val' }, stealth?.machineIdHash || '—')
            ),
            h('div', { className: 'ofm_stealth_row' },
              h('span', { className: 'ofm_stealth_label' }, t('sessionId')),
              h('span', { className: 'ofm_stealth_val' }, stealth?.sessionId || '—')
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
      let loading = false, lastFetch = 0, lastClick = 0, scheduled = false, rendering = false

      const fmtReset = (iso) => {
        const t = new Date(iso).getTime()
        if (isNaN(t)) return ''
        const diff = Math.max(0, Math.floor((t - Date.now()) / 60000))
        if (!diff) return '即将重置'
        const h = Math.floor(diff / 60), d = Math.floor(h / 24)
        return d ? `${d}天${h % 24 ? (h % 24) + '小时' : ''}后重置` : h ? `${h}小时${diff % 60}分后重置` : `${diff}分钟后重置`
      }

      function buildCardHtml(q) {
        if (!q) return ''
        const accs = q.accounts?.length ? q.accounts : [{
          nickname: q.primaryAccount || 'Gemini 账号',
          isPrimary: true, fiveHour: q.fiveHour, weekly: q.weekly
        }]

        return accs.map((a, i) => {
          const p5 = a.fiveHour ? `${a.fiveHour.percent}%` : (a.ok === false ? '不可用' : '—')
          const pW = a.weekly ? `${a.weekly.percent}%` : (a.ok === false ? '不可用' : '—')
          const r5 = a.fiveHour ? fmtReset(a.fiveHour.resetTime) : ''
          const rW = a.weekly ? fmtReset(a.weekly.resetTime) : ''
          const isLow = !!(a.fiveHour && a.fiveHour.percent < 20)
          const badge = a.isPrimary
            ? '<span class="dsh-badge-primary">使用中</span>'
            : (a.isRateLimited ? '<span class="dsh-badge-warn">限流冷却</span>' : '<span class="dsh-badge-standby">备用</span>')

          return `
            ${i > 0 ? '<div class="dsh-acct-sep"></div>' : ''}
            <div class="dsh-acct-head"><span class="dsh-acct-name" title="${a.nickname}">${a.nickname}</span>${badge}</div>
            <span class="dsh-col-label">5小时配额：</span><span class="dsh-col-val ${isLow ? 'dsh-val-warn' : ''}">剩余 ${p5}</span><span class="dsh-col-reset">${r5 ? '（' + r5 + '）' : ''}</span>
            <span class="dsh-col-label">周总配额：</span><span class="dsh-col-val">剩余 ${pW}</span><span class="dsh-col-reset">${rW ? '（' + rW + '）' : ''}</span>
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
          const res = await window.fetch('/api/gemini-quota', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ force }),
            signal: AbortSignal.timeout(4500)
          })
          const data = await res.json().catch(() => null)
          if (data?.ok) {
            quota = data
            lastFetch = Date.now()
            try { sessionStorage.setItem('dsh_gemini_quota_cache', JSON.stringify(data)); } catch {}
          } else if (data?.enabled === false) {
            quota = null
            try { sessionStorage.removeItem('dsh_gemini_quota_cache'); } catch {}
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

      const isTargetGemini = (el) => {
        if (!el) return false
        const sel = getActiveSelection(el)
        if (sel) return sel.provider === 'gemini'
        const txt = ((el.textContent || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase()
        return (txt.includes('gemini') && txt.includes('3.8')) || (txt.includes('gemini') && !/\b(1\.5|2\.0|2\.5|custom|api|openai|gateway)\b/.test(txt))
      }

      function render() {
        if (rendering) return
        rendering = true
        try {
          const anchor = findAnchor()
          let box = document.getElementById('dsh-gemini-quota-indicator')
          if (!anchor) return box?.remove()
          if (!isTargetGemini(anchor) || (quota && quota.enabled === false)) return box && (box.style.display = 'none')
          if (!quota) {
            if (box) box.style.display = 'none'
            return fetchQuota()
          }

          const p5 = quota.fiveHour ? `${quota.fiveHour.percent}%` : '—'
          const pW = quota.weekly ? `${quota.weekly.percent}%` : '—'
          const cardHtml = buildCardHtml(quota)
          const key = `${p5}_${pW}_${cardHtml.length}_${quota.primaryAccountId}`

          if (!box) {
            box = document.createElement('div')
            box.id = 'dsh-gemini-quota-indicator'
            box.className = 'dsh-gemini-quota-box'
            box.innerHTML = `
              <span class="dsh-quota-txt">5h: ${p5} ｜ 周: ${pW}</span>
              <div class="dsh-gemini-quota-card">${cardHtml}</div>`
            box.dataset.renderedKey = key
            box.onmouseenter = () => { if (Date.now() - lastFetch > 3000) fetchQuota(); }
            box.onclick = async (e) => {
              e.stopPropagation()
              const now = Date.now()
              if (now - lastClick < 2000) return
              lastClick = now
              await fetchQuota(true)
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
              if (cardEl) cardEl.innerHTML = cardHtml
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
      const onFocus = () => { if (Date.now() - lastFetch > 15000) fetchQuota(); }
      window.addEventListener('focus', onFocus)
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
        id: 'our-free-model',
        order: 35,
        label: () => t('nav'),
        locale: NS,
      }, props => h(SettingsPage, { ...props, locale: ctx?.locale?.language || 'zh' })))

      // Complete onboarding immediately
      ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
        name: 'settings.onboarding',
        id: 'our-free-model-announcement',
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
