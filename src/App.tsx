import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import type { HubTask, HubCalendarEvent, HubEmail, HubDeploy, SyncStatus } from './lib/supabase'

// ── Brand tokens ──────────────────────────────────────
const PRIORITY_COLOURS: Record<number, string> = {
  1: '#EF4444', // urgent
  2: '#F97316', // high
  3: '#FBBF24', // normal
  4: '#6B7280', // low
}
const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low'
}
const STATUS_ICON: Record<string, string> = {
  'open': '○', 'in progress': '◑', 'complete': '✓', 'closed': '✓',
  'review': '◐', 'blocked': '✕', 'todo': '○',
}
const DEPLOY_COLOURS: Record<string, string> = {
  'READY': '#10B981', 'ERROR': '#EF4444', 'BUILDING': '#F59E0B',
  'CANCELED': '#6B7280', 'QUEUED': '#A855F7',
}

function fmt(dt?: string | null) {
  if (!dt) return '—'
  const d = new Date(dt)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isTomorrow) return `Tomorrow ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
function timeAgo(dt?: string | null) {
  if (!dt) return '—'
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Empty state placeholders (shown when tables have no data yet) ──
const EMPTY_TASKS: HubTask[] = [
  { id: '1', clickup_id: 'demo-1', title: 'Fix auth flow in OS³ app', status: 'in progress', priority: 1, due_date: new Date().toISOString(), space: 'JB³ Ai', list_name: 'Action Items', synced_at: new Date().toISOString() },
  { id: '2', clickup_id: 'demo-2', title: 'Deploy v2.1 to production', status: 'open', priority: 2, due_date: new Date().toISOString(), space: 'JB³ Ai', list_name: 'DASHBOARD', synced_at: new Date().toISOString() },
  { id: '3', clickup_id: 'demo-3', title: 'Record Daily Show ep 4', status: 'todo', priority: 3, due_date: new Date().toISOString(), space: 'JB³ Ai', list_name: 'Media', synced_at: new Date().toISOString() },
]
const EMPTY_EVENTS: HubCalendarEvent[] = [
  { id: '1', gcal_id: 'demo-1', title: 'JB³Ai Platform Review', calendar_name: 'JB³Ai WORK', start_time: new Date(Date.now() + 3600000).toISOString(), end_time: new Date(Date.now() + 7200000).toISOString(), synced_at: new Date().toISOString() },
  { id: '2', gcal_id: 'demo-2', title: 'Client Call', calendar_name: 'JB³Ai Appointments', start_time: new Date(Date.now() + 14400000).toISOString(), end_time: new Date(Date.now() + 16200000).toISOString(), synced_at: new Date().toISOString() },
]
const EMPTY_EMAILS: HubEmail[] = [
  { id: '1', gmail_id: 'demo-1', subject: 'Contract review needed', sender: 'Client', sender_email: 'client@example.com', snippet: 'Please review the attached contract before...', is_unread: true, received_at: new Date(Date.now() - 1800000).toISOString(), synced_at: new Date().toISOString() },
  { id: '2', gmail_id: 'demo-2', subject: 'PR #34 merged to main', sender: 'GitHub', sender_email: 'noreply@github.com', snippet: 'jonoblackburn merged pull request #34...', is_unread: true, received_at: new Date(Date.now() - 3600000).toISOString(), synced_at: new Date().toISOString() },
]
const EMPTY_DEPLOYS: HubDeploy[] = [
  { id: '1', vercel_id: 'demo-1', project_name: 'jb3ai-os3', status: 'READY', url: 'https://jb3ai.vercel.app', branch: 'main', deployed_at: new Date(Date.now() - 120000).toISOString(), synced_at: new Date().toISOString() },
  { id: '2', vercel_id: 'demo-2', project_name: 'voicescript', status: 'BUILDING', branch: 'feat/v2', deployed_at: new Date(Date.now() - 60000).toISOString(), synced_at: new Date().toISOString() },
]

export default function App() {
  const [tasks, setTasks] = useState<HubTask[]>([])
  const [events, setEvents] = useState<HubCalendarEvent[]>([])
  const [emails, setEmails] = useState<HubEmail[]>([])
  const [deploys, setDeploys] = useState<HubDeploy[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [quickInput, setQuickInput] = useState('')
  const [quickMode, setQuickMode] = useState<'task'|'event'|'email'|null>(null)

  const loadData = useCallback(async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString()

    const [t, e, m, d, s] = await Promise.all([
      supabase.from('hub_tasks').select('*').gte('due_date', todayStart).order('priority', { ascending: true }).limit(20),
      supabase.from('hub_calendar').select('*').gte('start_time', todayStart).lte('start_time', tomorrowEnd).order('start_time').limit(10),
      supabase.from('hub_emails').select('*').eq('is_unread', true).order('received_at', { ascending: false }).limit(10),
      supabase.from('hub_deploys').select('*').order('deployed_at', { ascending: false }).limit(5),
      supabase.from('hub_sync_status').select('*').order('source'),
    ])

    setTasks(t.data?.length ? t.data : EMPTY_TASKS)
    setEvents(e.data?.length ? e.data : EMPTY_EVENTS)
    setEmails(m.data?.length ? m.data : EMPTY_EMAILS)
    setDeploys(d.data?.length ? d.data : EMPTY_DEPLOYS)
    setSyncStatus(s.data ?? [])
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Real-time subscriptions
    const channels = [
      supabase.channel('hub_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'hub_tasks' }, loadData).subscribe(),
      supabase.channel('hub_calendar').on('postgres_changes', { event: '*', schema: 'public', table: 'hub_calendar' }, loadData).subscribe(),
      supabase.channel('hub_emails').on('postgres_changes', { event: '*', schema: 'public', table: 'hub_emails' }, loadData).subscribe(),
      supabase.channel('hub_deploys').on('postgres_changes', { event: '*', schema: 'public', table: 'hub_deploys' }, loadData).subscribe(),
    ]
    const interval = setInterval(loadData, 5 * 60 * 1000) // 5-min poll fallback
    return () => {
      channels.forEach(c => c.unsubscribe())
      clearInterval(interval)
    }
  }, [loadData])

  const unreadCount = emails.filter(e => e.is_unread).length

  return (
    <div style={{ background: '#0A0C10', color: '#E8ECF1', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ background: '#0E1116', borderBottom: '1px solid #1E2530', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>JB³Ai</span>
          <span style={{ fontSize: 11, background: 'rgba(42,241,255,.13)', color: '#2AF1FF', padding: '3px 10px', borderRadius: 4, fontWeight: 600, letterSpacing: 1 }}>Command Centre</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Refreshed {timeAgo(lastRefresh.toISOString())}</span>
          <button onClick={loadData} style={{ background: 'rgba(42,241,255,.1)', border: '1px solid rgba(42,241,255,.3)', color: '#2AF1FF', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Sync Status Bar ───────────────────────────────── */}
      {syncStatus.length > 0 && (
        <div style={{ background: '#0E1116', borderBottom: '1px solid #1E2530', padding: '8px 28px', display: 'flex', gap: 20 }}>
          {syncStatus.map(s => (
            <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.last_status === 'success' ? '#10B981' : s.last_status === 'pending' ? '#F59E0B' : '#EF4444', display: 'inline-block' }} />
              <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>{s.source}</span>
              {s.last_synced_at && <span style={{ color: '#374151' }}>{timeAgo(s.last_synced_at)}</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            <div>Loading your hub…</div>
          </div>
        ) : (
          <>
            {/* ── Main grid ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* TASKS */}
              <Panel title="Today's Tasks" icon="📋" count={tasks.length} accent="#2AF1FF" action={{ label: '+ New Task', onClick: () => setQuickMode('task') }}>
                {tasks.length === 0
                  ? <Empty text="No tasks due today" />
                  : tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                      <span style={{ color: PRIORITY_COLOURS[task.priority ?? 3] ?? '#6B7280', fontSize: 16, lineHeight: 1, marginTop: 2 }}>
                        {STATUS_ICON[task.status?.toLowerCase() ?? ''] ?? '○'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          {task.list_name ?? task.space} · {task.due_date ? fmt(task.due_date) : 'No due date'}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, background: `${PRIORITY_COLOURS[task.priority ?? 3]}22`, color: PRIORITY_COLOURS[task.priority ?? 3] ?? '#6B7280', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {PRIORITY_LABELS[task.priority ?? 3] ?? ''}
                      </span>
                    </div>
                  ))
                }
              </Panel>

              {/* CALENDAR */}
              <Panel title="Calendar" icon="📅" count={events.length} accent="#A78BFA" action={{ label: '+ New Event', onClick: () => setQuickMode('event') }}>
                {events.length === 0
                  ? <Empty text="No events today or tomorrow" />
                  : events.map(ev => {
                    const isToday = ev.start_time && new Date(ev.start_time).toDateString() === new Date().toDateString()
                    return (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                        <div style={{ textAlign: 'right', minWidth: 52 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? '#2AF1FF' : '#E8ECF1' }}>{ev.start_time ? fmt(ev.start_time) : '—'}</div>
                          {!isToday && <div style={{ fontSize: 10, color: '#6B7280' }}>Tomorrow</div>}
                        </div>
                        <div style={{ width: 2, height: 36, background: ev.calendar_colour ?? '#A78BFA', borderRadius: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            {ev.calendar_name ?? 'Calendar'}{ev.location ? ` · ${ev.location}` : ''}{ev.meet_link ? ' · 🔗 Meet' : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </Panel>

              {/* INBOX */}
              <Panel title="Inbox" icon="📧" count={unreadCount} accent="#F59E0B" action={{ label: '+ Draft Email', onClick: () => setQuickMode('email') }}>
                {emails.length === 0
                  ? <Empty text="Inbox zero 🎉" />
                  : emails.map(em => (
                    <div key={em.id} style={{ padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: em.is_unread ? 700 : 400, color: em.is_unread ? '#E8ECF1' : '#9CA3AF' }}>{em.sender ?? em.sender_email}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{timeAgo(em.received_at)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: em.is_unread ? 600 : 400, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{em.subject}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{em.snippet}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <ActionBtn label="Reply" />
                        <ActionBtn label="→ Task" accent />
                        <ActionBtn label="Archive" />
                      </div>
                    </div>
                  ))
                }
              </Panel>

              {/* DEPLOYS */}
              <Panel title="Deploys" icon="🚀" count={deploys.length} accent="#10B981" action={{ label: 'Trigger Deploy ▾', onClick: () => {} }}>
                {deploys.length === 0
                  ? <Empty text="No recent deployments" />
                  : deploys.map(dep => (
                    <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                      <span style={{ fontSize: 18 }}>{dep.status === 'READY' ? '✅' : dep.status === 'ERROR' ? '❌' : dep.status === 'BUILDING' ? '⏳' : '○'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{dep.project_name}</span>
                          <span style={{ fontSize: 10, background: `${DEPLOY_COLOURS[dep.status ?? ''] ?? '#6B7280'}22`, color: DEPLOY_COLOURS[dep.status ?? ''] ?? '#6B7280', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>{dep.status}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          {dep.branch ?? 'main'}{dep.commit_message ? ` · ${dep.commit_message.slice(0, 40)}` : ''} · {timeAgo(dep.deployed_at)}
                        </div>
                      </div>
                      {dep.url && dep.status === 'READY' && (
                        <a href={dep.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2AF1FF', textDecoration: 'none' }}>↗ Live</a>
                      )}
                    </div>
                  ))
                }
              </Panel>
            </div>

            {/* ── Quick Actions bar ──────────────────────────── */}
            <div style={{ background: '#0E1116', border: '1px solid #1E2530', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>⚡ Quick Actions</div>
              {quickMode ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={quickInput}
                    onChange={e => setQuickInput(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && (setQuickMode(null), setQuickInput(''))}
                    placeholder={quickMode === 'task' ? 'Task title, priority, due date…' : quickMode === 'event' ? 'Event title, time, calendar…' : 'To, subject, body…'}
                    style={{ flex: 1, background: '#151A22', border: '1px solid #2AF1FF44', color: '#E8ECF1', padding: '10px 14px', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                  <button onClick={() => { setQuickMode(null); setQuickInput('') }} style={{ background: '#151A22', border: '1px solid #1E2530', color: '#6B7280', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  <button style={{ background: '#2AF1FF', color: '#0A0C10', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: 'none' }}>
                    {quickMode === 'task' ? 'Create Task' : quickMode === 'event' ? 'Create Event' : 'Send Draft'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: '📋 New Task', mode: 'task' as const },
                    { label: '📅 New Event', mode: 'event' as const },
                    { label: '✉️ Draft Email', mode: 'email' as const },
                  ].map(btn => (
                    <button key={btn.label} onClick={() => setQuickMode(btn.mode)} style={{ background: '#151A22', border: '1px solid #1E2530', color: '#E8ECF1', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, transition: 'all .15s' }}>
                      {btn.label}
                    </button>
                  ))}
                  <button onClick={loadData} style={{ background: '#151A22', border: '1px solid #1E2530', color: '#E8ECF1', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    ↻ Sync All
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 28px', borderTop: '1px solid #1E2530', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
        <span>JB³Ai · OS³ · Pretoria, Gauteng, South Africa</span>
        <span>Supabase real-time · ClickUp · GCal · Gmail · Vercel</span>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────
function Panel({ title, icon, count, accent, action, children }: {
  title: string; icon: string; count: number; accent: string;
  action?: { label: string; onClick: () => void }; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#111519', border: '1px solid #1E2530', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          <span style={{ fontSize: 11, background: `${accent}22`, color: accent, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{count}</span>
        </div>
        {action && (
          <button onClick={action.onClick} style={{ background: 'transparent', border: `1px solid ${accent}44`, color: accent, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: '24px 0', textAlign: 'center', color: '#374151', fontSize: 13 }}>{text}</div>
}

function ActionBtn({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <button style={{ background: accent ? 'rgba(42,241,255,.1)' : '#151A22', border: `1px solid ${accent ? 'rgba(42,241,255,.3)' : '#1E2530'}`, color: accent ? '#2AF1FF' : '#9CA3AF', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
      {label}
    </button>
  )
}
