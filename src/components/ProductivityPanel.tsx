import { useEffect, useMemo, useRef, useState } from 'react'
import {
  supabase,
  type HubTask,
  type HubBriefing,
  type HubProductivitySession,
} from '@/lib/supabase'

// ── Brand tokens (OS³) ──
const COLORS = {
  matteBlack: '#0A0C10',
  deepGraphite: '#0E1116',
  steel: '#151A22',
  border: '#1E2530',
  cyan: '#2AF1FF',
  gold: '#D4AF37',
  red: '#EF4444',
  green: '#10B981',
  textDim: '#9AA3AD',
  textBright: '#E4E8EE',
}

type PomodoroMode = 'focus' | 'break'
const FOCUS_MIN = 25
const BREAK_MIN = 5

function fmtDue(d?: string) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return d
  }
}

function priorityBadge(p?: number) {
  if (p === 1) return { label: 'Urgent', color: COLORS.red }
  if (p === 2) return { label: 'High', color: COLORS.gold }
  if (p === 3) return { label: 'Normal', color: COLORS.cyan }
  return { label: 'Low', color: COLORS.textDim }
}

function beep(hz: number) {
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = hz
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    o.start()
    o.stop(ctx.currentTime + 0.65)
  } catch {
    /* noop */
  }
}

export default function ProductivityPanel() {
  const [triage, setTriage] = useState<HubTask[]>([])
  const [tasks, setTasks] = useState<HubTask[]>([])
  const [morning, setMorning] = useState<HubBriefing | null>(null)
  const [evening, setEvening] = useState<HubBriefing | null>(null)
  const [sunday, setSunday] = useState<HubBriefing | null>(null)
  const [focusMinutesToday, setFocusMinutesToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Pomodoro state
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [remaining, setRemaining] = useState(FOCUS_MIN * 60)
  const [running, setRunning] = useState(false)
  const startedAt = useRef<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  async function logSession(duration: number, kind: PomodoroMode) {
    if (!startedAt.current) return
    const endedAt = new Date().toISOString()
    const body: Partial<HubProductivitySession> = {
      session_type: kind,
      duration_minutes: duration,
      started_at: startedAt.current,
      ended_at: endedAt,
      source: 'os3-command-centre-react',
    }
    await supabase.from('hub_productivity_sessions').insert(body)
    startedAt.current = null
  }

  function startTimer() {
    if (running) return
    startedAt.current = new Date().toISOString()
    setRunning(true)
  }

  function pauseTimer() {
    setRunning(false)
  }

  function resetTimer() {
    setRunning(false)
    startedAt.current = null
    setRemaining(mode === 'focus' ? FOCUS_MIN * 60 : BREAK_MIN * 60)
  }

  function switchMode(next: PomodoroMode) {
    setMode(next)
    setRunning(false)
    startedAt.current = null
    setRemaining(next === 'focus' ? FOCUS_MIN * 60 : BREAK_MIN * 60)
  }

  // tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // session ended
          const completedMin = mode === 'focus' ? FOCUS_MIN : BREAK_MIN
          void logSession(completedMin, mode)
          beep(mode === 'focus' ? 660 : 520)
          // swap mode
          const next: PomodoroMode = mode === 'focus' ? 'break' : 'focus'
          setMode(next)
          setRunning(false)
          // refresh focus total
          void refreshFocusTotal()
          return next === 'focus' ? FOCUS_MIN * 60 : BREAK_MIN * 60
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode])

  async function loadTriage() {
    const { data } = await supabase
      .from('hub_tasks')
      .select('*')
      .eq('list_name', 'Inbox Triage')
      .neq('status', 'closed')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true })
      .limit(30)
    setTriage((data as HubTask[]) || [])
  }

  async function loadTasks() {
    const { data } = await supabase
      .from('hub_tasks')
      .select('*')
      .neq('status', 'closed')
      .neq('list_name', 'Inbox Triage')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true })
      .limit(40)
    setTasks((data as HubTask[]) || [])
  }

  async function loadBriefings() {
    const { data } = await supabase
      .from('hub_briefings')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(20)
    const list = (data as HubBriefing[]) || []
    setMorning(list.find((b) => b.briefing_type === 'morning') ?? null)
    setEvening(list.find((b) => b.briefing_type === 'evening') ?? null)
    setSunday(list.find((b) => b.briefing_type === 'sunday') ?? null)
  }

  async function refreshFocusTotal() {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('hub_productivity_sessions')
      .select('duration_minutes,session_type,started_at')
      .eq('session_type', 'focus')
      .gte('started_at', startOfDay.toISOString())
    const total = ((data as HubProductivitySession[]) || []).reduce(
      (a, s) => a + (s.duration_minutes || 0),
      0,
    )
    setFocusMinutesToday(total)
  }

  async function refreshAll() {
    setLoading(true)
    await Promise.all([loadTriage(), loadTasks(), loadBriefings(), refreshFocusTotal()])
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    void refreshAll()
    const t = window.setInterval(() => void refreshAll(), 5 * 60 * 1000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overdueCount = useMemo(() => {
    const now = Date.now()
    return tasks.filter((t) => t.due_date && new Date(t.due_date).getTime() < now).length
  }, [tasks])

  const mmss = useMemo(() => {
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [remaining])

  // ── render ──
  return (
    <div
      className="min-h-screen"
      style={{ background: COLORS.matteBlack, color: COLORS.textBright, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: COLORS.border, background: COLORS.deepGraphite }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold"
            style={{
              background: COLORS.steel,
              color: COLORS.cyan,
              fontFamily: 'Orbitron, monospace',
              fontSize: '14px',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            J³
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '15px',
                letterSpacing: '0.12em',
                color: COLORS.textBright,
              }}
            >
              OS³ · PRODUCTIVITY
            </div>
            <div style={{ fontSize: '11px', color: COLORS.textDim, letterSpacing: '0.08em' }}>
              {focusMinutesToday} min focus today
              {lastRefresh ? ` · synced ${lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: COLORS.textDim }}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Triage Queue" value={triage.length} accent={COLORS.cyan} />
          <StatCard label="Open Tasks" value={tasks.length} accent={COLORS.textBright} />
          <StatCard label="Overdue" value={overdueCount} accent={overdueCount > 0 ? COLORS.red : COLORS.textDim} />
          <StatCard label="Focus Today" value={`${focusMinutesToday} min`} accent={COLORS.gold} />
        </div>

        {/* Top row: briefings + pomodoro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BriefingCard title="Morning Briefing" briefing={morning} accent={COLORS.cyan} />
          <BriefingCard title="Evening Review" briefing={evening} accent={COLORS.gold} />
          <PomodoroCard
            mode={mode}
            mmss={mmss}
            running={running}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onSwitch={switchMode}
          />
        </div>

        {/* Triage */}
        <Panel title={`Triage Queue (${triage.length})`}>
          {loading && triage.length === 0 ? (
            <Empty>Loading…</Empty>
          ) : triage.length === 0 ? (
            <Empty>Inbox is clear.</Empty>
          ) : (
            <TaskTable rows={triage} stripPrefix="[TRIAGE] " />
          )}
        </Panel>

        {/* Combined Tasks */}
        <Panel title={`Open Tasks (${tasks.length})`}>
          {loading && tasks.length === 0 ? (
            <Empty>Loading…</Empty>
          ) : tasks.length === 0 ? (
            <Empty>All tasks complete.</Empty>
          ) : (
            <TaskTable rows={tasks} showSource />
          )}
        </Panel>

        {/* Sunday planner */}
        <Panel title="Sunday Planner">
          {sunday ? (
            <div style={{ color: COLORS.textBright, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {sunday.body_md || sunday.title || '—'}
            </div>
          ) : (
            <Empty>No Sunday plan yet.</Empty>
          )}
        </Panel>
      </div>
    </div>
  )
}

// ── Sub components ──

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div
      className="p-4 rounded border"
      style={{ background: COLORS.deepGraphite, borderColor: COLORS.border }}
    >
      <div style={{ fontSize: 11, color: COLORS.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 24,
          fontWeight: 600,
          color: accent,
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded border"
      style={{ background: COLORS.deepGraphite, borderColor: COLORS.border }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: COLORS.border }}
      >
        <div
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 13,
            letterSpacing: '0.1em',
            color: COLORS.textBright,
          }}
        >
          {title}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: COLORS.textDim, fontSize: 13, padding: '12px 0' }}>{children}</div>
  )
}

function BriefingCard({
  title,
  briefing,
  accent,
}: {
  title: string
  briefing: HubBriefing | null
  accent: string
}) {
  return (
    <div
      className="p-4 rounded border h-full"
      style={{ background: COLORS.deepGraphite, borderColor: COLORS.border }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 12,
          letterSpacing: '0.12em',
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {briefing ? (
        <>
          <div style={{ fontSize: 13, color: COLORS.textBright, marginBottom: 8, fontWeight: 500 }}>
            {briefing.title || '—'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: COLORS.textDim,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              maxHeight: 180,
              overflow: 'auto',
            }}
          >
            {briefing.body_md || '—'}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 10 }}>
            {new Date(briefing.generated_at).toLocaleString('en-ZA', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </>
      ) : (
        <Empty>No briefing yet.</Empty>
      )}
    </div>
  )
}

function PomodoroCard({
  mode,
  mmss,
  running,
  onStart,
  onPause,
  onReset,
  onSwitch,
}: {
  mode: PomodoroMode
  mmss: string
  running: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSwitch: (m: PomodoroMode) => void
}) {
  return (
    <div
      className="p-4 rounded border h-full flex flex-col"
      style={{ background: COLORS.deepGraphite, borderColor: COLORS.border }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 12,
          letterSpacing: '0.12em',
          color: mode === 'focus' ? COLORS.cyan : COLORS.gold,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {mode === 'focus' ? 'Focus · 25' : 'Break · 5'}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 48,
            fontWeight: 600,
            color: COLORS.textBright,
            letterSpacing: '0.04em',
          }}
        >
          {mmss}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {!running ? (
          <button
            onClick={onStart}
            className="flex-1 py-2 rounded text-xs"
            style={{
              background: COLORS.cyan,
              color: COLORS.matteBlack,
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            START
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 py-2 rounded text-xs"
            style={{
              background: COLORS.gold,
              color: COLORS.matteBlack,
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            PAUSE
          </button>
        )}
        <button
          onClick={onReset}
          className="py-2 px-3 rounded text-xs"
          style={{
            background: 'transparent',
            color: COLORS.textDim,
            border: `1px solid ${COLORS.border}`,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSwitch('focus')}
          className="flex-1 py-1 rounded text-xs"
          style={{
            background: mode === 'focus' ? COLORS.steel : 'transparent',
            color: mode === 'focus' ? COLORS.cyan : COLORS.textDim,
            border: `1px solid ${COLORS.border}`,
            cursor: 'pointer',
          }}
        >
          Focus 25
        </button>
        <button
          onClick={() => onSwitch('break')}
          className="flex-1 py-1 rounded text-xs"
          style={{
            background: mode === 'break' ? COLORS.steel : 'transparent',
            color: mode === 'break' ? COLORS.gold : COLORS.textDim,
            border: `1px solid ${COLORS.border}`,
            cursor: 'pointer',
          }}
        >
          Break 5
        </button>
      </div>
    </div>
  )
}

function TaskTable({
  rows,
  stripPrefix,
  showSource,
}: {
  rows: HubTask[]
  stripPrefix?: string
  showSource?: boolean
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <th style={thStyle}>Task</th>
            <th style={thStyle}>List</th>
            {showSource && <th style={thStyle}>Source</th>}
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const title = stripPrefix ? (t.title || '').replace(stripPrefix, '') : t.title
            const p = priorityBadge(t.priority)
            const isGTasks = (t.clickup_id || '').startsWith('gtasks:')
            return (
              <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={tdStyle}>
                  <div style={{ color: COLORS.textBright }}>{title || '—'}</div>
                  {t.tags && t.tags.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {t.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10,
                            color: COLORS.textDim,
                            background: COLORS.steel,
                            padding: '2px 6px',
                            borderRadius: 3,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ ...tdStyle, color: COLORS.textDim }}>{t.list_name || '—'}</td>
                {showSource && (
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'Orbitron, monospace',
                        letterSpacing: '0.08em',
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: isGTasks ? 'rgba(42,241,255,0.12)' : 'rgba(168,85,247,0.14)',
                        color: isGTasks ? COLORS.cyan : '#C4A0F7',
                      }}
                    >
                      {isGTasks ? 'GTASKS' : 'CLICKUP'}
                    </span>
                  </td>
                )}
                <td style={tdStyle}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: 'transparent',
                      border: `1px solid ${p.color}`,
                      color: p.color,
                    }}
                  >
                    {p.label}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: COLORS.textDim }}>{fmtDue(t.due_date)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: 10,
  fontFamily: 'Orbitron, monospace',
  letterSpacing: '0.12em',
  color: COLORS.textDim,
  textTransform: 'uppercase',
  fontWeight: 500,
}

const tdStyle: React.CSSProperties = {
  padding: '10px',
  verticalAlign: 'top',
}
