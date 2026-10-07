/**
 * dsh-gemini — Browser Half
 * 
 * DeepSeek Harness Native UI Integration:
 * - Dynamic Model Discovery with Live PA Fetch
 * - Dual-Quota Ring & Gauge Monitoring
 * - Hardware Hash & Anti-Fingerprint Diagnostics
 * - Chat Input Floating Quota Indicator
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
        quota5h: '5小时配额',
        quotaWeekly: '周总配额',
        resetAt: '重置于',
        accountActive: '主用账号',
        modelRoster: '可用模型清单',
        modelCount: '已发现可用模型',
        modelThinking: '思考模式',
        modelVision: '多模态视觉',
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
        quota5h: '5-Hour Quota',
        quotaWeekly: 'Weekly Quota',
        resetAt: 'Resets at',
        accountActive: 'Primary',
        modelRoster: 'Available Models',
        modelCount: 'Available models discovered',
        modelThinking: 'Thinking',
        modelVision: 'Vision',
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
.ofm_btn_secondary {
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
  color: var(--dsw-alias-label-primary, #e0e0e0);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
}
.ofm_btn_icon {
  font-size: 13px;
  line-height: 1;
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
.ofm_account_item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.ofm_account_name {
  font-size: 13px;
  font-family: monospace;
  color: var(--dsw-alias-label-primary, #e0e0e0);
}
.ofm_account_tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  font-weight: 500;
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
.ofm_effort_row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.ofm_effort_label {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #9e9e9e);
}
.ofm_effort_pills {
  display: flex;
  gap: 4px;
}
.ofm_effort_pill {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
  color: var(--dsw-alias-label-secondary, #a0a0a0);
}
.ofm_effort_pill_active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #93c5fd;
  font-weight: 600;
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
.ofm_spinner {
  display: inline-block;
  animation: ofmspin 1s linear infinite;
}
@keyframes ofmspin {
  100% { transform: rotate(360deg); }
}
.ofm_input_quota_box {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
  color: var(--dsw-alias-label-primary, #dddddd);
  user-select: none;
  position: relative;
  transition: all 0.15s ease;
}
.ofm_input_quota_txt {
  line-height: 1;
}
.ofm_input_quota_popup {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #1e1e24);
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.2));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  font-size: 11px;
  line-height: 1.5;
  display: none;
  z-index: 99999;
}
`

    function ensureStyles() {
      if (typeof document === 'undefined') return
      if (document.getElementById('dsh-gemini-style')) return
      const s = document.createElement('style')
      s.id = 'dsh-gemini-style'
      s.textContent = CSS
      document.head.appendChild(s)
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
        return dateStr
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
      const [stealth, setStealth] = useState(null)
      const [fetching, setFetching] = useState(false)
      const [pingMs, setPingMs] = useState(null)
      const [pinging, setPinging] = useState(false)

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
        loadStealth()
      }, [loadQuota, loadModels, loadStealth])

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
            h('button', {
              className: 'ofm_btn ofm_btn_primary',
              disabled: fetching,
              onClick: handleFetchModels
            },
              h('span', { className: fetching ? 'ofm_btn_icon ofm_spinner' : 'ofm_btn_icon' }, '⟳'),
              fetching ? t('fetchingModels') : t('fetchModels')
            ),
            h('button', {
              className: 'ofm_btn ofm_btn_secondary',
              disabled: pinging,
              onClick: handlePing
            },
              h('span', { className: pinging ? 'ofm_btn_icon ofm_spinner' : 'ofm_btn_icon' }, '⚡'),
              pinging ? t('pingTesting') : (pingMs !== null ? `${t('pingSuccess')} ${pingMs}ms` : t('pingTest'))
            ),
            h('button', {
              className: 'ofm_btn ofm_btn_secondary',
              onClick: () => loadQuota(true)
            },
              h('span', { className: 'ofm_btn_icon' }, '↺'),
              t('refreshQuota')
            )
          )
        ),

        // Dual Quota Gauges & Primary Account
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

        // Primary Account Status
        quota?.primaryAccount ? h('div', { className: 'ofm_card' },
          h('div', { className: 'ofm_card_title' },
            '账号配置',
            h('span', { className: 'ofm_badge ofm_badge_success' }, t('statusOk'))
          ),
          h('div', { className: 'ofm_account_item' },
            h('span', { className: 'ofm_account_name' }, quota.primaryAccount),
            h('span', { className: 'ofm_account_tag' }, t('accountActive'))
          )
        ) : null,

        // Models Roster
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
                m.supportsImages ? h('span', { className: 'ofm_model_tag' }, t('modelVision')) : null
              ),
              m.supportsThinking ? h('div', { className: 'ofm_effort_row' },
                h('span', { className: 'ofm_effort_label' }, '思考档位：'),
                h('div', { className: 'ofm_effort_pills' },
                  h('span', { className: 'ofm_effort_pill' }, '低'),
                  h('span', { className: 'ofm_effort_pill ofm_effort_pill_active' }, '中'),
                  h('span', { className: 'ofm_effort_pill' }, '高'),
                  h('span', { className: 'ofm_effort_pill' }, '自适应')
                )
              ) : null
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

    // ── Chat Input Floating Quota Indicator ──────────────────────────────────
    function setupInputQuotaIndicator() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return
      let quotaData = null
      let lastFetchTime = 0

      async function queryQuota(force = false) {
        if (!force && quotaData && Date.now() - lastFetchTime < 10000) return
        try {
          const res = await window.fetch('/api/gemini/quota', {
            method: force ? 'POST' : 'GET',
            headers: { 'Accept': 'application/json' }
          })
          const d = await res.json()
          if (d?.ok) {
            quotaData = d
            lastFetchTime = Date.now()
            updatePill()
          }
        } catch {}
      }

      function findModelAnchor() {
        return document.querySelector('[data-slot="conversation.input.model"]') ||
               document.querySelector('.conversation-input-model') ||
               document.querySelector('button[aria-haspopup="menu"][title*="·"]')
      }

      function updatePill() {
        const anchor = findModelAnchor()
        if (!anchor) return
        let pill = document.getElementById('dsh-gemini-quota-pill')
        const p5 = quotaData?.fiveHour?.percent !== undefined ? `${quotaData.fiveHour.percent}%` : '—'
        const pW = quotaData?.weekly?.percent !== undefined ? `${quotaData.weekly.percent}%` : '—'

        if (!pill) {
          pill = document.createElement('div')
          pill.id = 'dsh-gemini-quota-pill'
          pill.className = 'ofm_input_quota_box'
          pill.onclick = e => {
            e.stopPropagation()
            queryQuota(true)
          }
          anchor.insertAdjacentElement('beforebegin', pill)
        }

        const r5 = formatReset(quotaData?.fiveHour?.resetTime)
        const rW = formatReset(quotaData?.weekly?.resetTime)

        pill.textContent = ''
        const txtSpan = document.createElement('span')
        txtSpan.className = 'ofm_input_quota_txt'
        txtSpan.textContent = `5h: ${p5} ｜ 周: ${pW}`

        const popupDiv = document.createElement('div')
        popupDiv.className = 'ofm_input_quota_popup'
        popupDiv.innerHTML = `<strong>Google Gemini 实时配额</strong><br/>5小时配额: ${p5} ${r5 ? `(${r5})` : ''}<br/>周总配额: ${pW} ${rW ? `(${rW})` : ''}<br/><span style="opacity:0.7">点击强制刷新</span>`

        pill.appendChild(txtSpan)
        pill.appendChild(popupDiv)
      }

      setInterval(() => {
        if (!document.hidden) queryQuota()
      }, 30000)

      setTimeout(() => queryQuota(), 1000)
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

      // Mount input quota pill
      setupInputQuotaIndicator()
    }

    exports.apply = apply
    exports.inject = inject
    exports.name = 'dsh-gemini'
    return module.exports
  }
})
