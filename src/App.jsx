import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SK, PRI, CAT, DAYS_L, MONS, MOOD_E, DEFAULT_TEMPLATES } from './constants'
import { ld, sv, ds, today, getMon, fmtM, fmtS, p2, calcStreak, calcDisc, motivMsg, buildUserContext, callAI, defBoard } from './utils'
import './index.css'

/* ── DARK/LIGHT TEMA HOOK ── */
function useTheme() {
  const [dark, setDark] = useState(() => ld(SK.theme, 'dark') !== 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    sv(SK.theme, dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

/* ── HAPTIC ── */
const haptic = (pattern) => { try { navigator.vibrate && navigator.vibrate(pattern) } catch {} }

/* ── ATOMS ── */
const Tag = ({ children, color, bg }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '.04em', padding: '2px 7px', borderRadius: 99, color, background: bg || color + '18', border: `.5px solid ${color}28` }}>{children}</span>
)
const Mono = ({ children, s = {} }) => (
  <span style={{ fontFamily: "'SF Mono','Menlo',monospace", letterSpacing: '-.01em', ...s }}>{children}</span>
)

/* ── SPLASH ── */
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 260)
    const t2 = setTimeout(() => setPhase(2), 1400)
    const t3 = setTimeout(() => onDone(), 1780)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: phase === 2 ? 0 : 1, transition: phase === 2 ? 'opacity .38s ease' : 'none', pointerEvents: 'none' }}>
      <div style={{ width: 96, height: 96, borderRadius: 22, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <span style={{ fontSize: 64, fontWeight: 800, color: '#000', lineHeight: 1, letterSpacing: '-.04em' }}>U</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.04em', marginTop: 20, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity .38s .1s ease,transform .38s .1s ease' }}>
        Up<span style={{ color: 'rgba(255,255,255,.25)' }}>.</span>
      </div>
      <div style={{ fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginTop: 10, opacity: phase >= 1 ? 1 : 0, transition: 'opacity .38s .18s ease' }}>
        Dünyayı değiştirmeye hazır mısın?
      </div>
    </div>
  )
}

/* ── OPAL ARKA PLAN ── */
function OpalBg({ dark }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: dark ? 'radial-gradient(circle,rgba(110,60,255,.18) 0%,transparent 65%)' : 'radial-gradient(circle,rgba(110,60,255,.08) 0%,transparent 65%)', top: -100, left: -70, filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: dark ? 'radial-gradient(circle,rgba(0,160,255,.1) 0%,transparent 65%)' : 'radial-gradient(circle,rgba(0,160,255,.05) 0%,transparent 65%)', top: 70, right: -50, filter: 'blur(45px)' }} />
      <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: dark ? 'radial-gradient(circle,rgba(255,60,120,.07) 0%,transparent 65%)' : 'radial-gradient(circle,rgba(255,60,120,.04) 0%,transparent 65%)', bottom: 160, left: -30, filter: 'blur(55px)' }} />
    </div>
  )
}

/* ── TIMER FLOAT ── */
function TimerFloat({ timers, onPause, onResume, onStop, dark }) {
  if (!timers || timers.length === 0) return null
  return (
    <div style={{ position: 'fixed', bottom: 'calc(62px + env(safe-area-inset-bottom,0px) + 10px)', left: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 90 }}>
      {timers.map(tm => {
        const col = tm.elapsed > (tm.dur || 0) * 60 && tm.dur > 0 ? '#ff453a' : '#C8A44A'
        return (
          <div key={tm.id} style={{ background: dark ? 'rgba(20,20,20,.95)' : 'rgba(255,255,255,.95)', border: `1px solid ${col}44`, borderRadius: 16, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(20px)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid rgba(128,128,128,.2)`, borderTop: `2px solid ${col}`, animation: tm.running ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Mono s={{ fontSize: 14, fontWeight: 700, color: col, display: 'block', lineHeight: 1.1 }}>{fmtS(tm.elapsed)}</Mono>
              <div style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{tm.title}</div>
            </div>
            <button onClick={() => tm.running ? onPause(tm.id) : onResume(tm.id)} style={{ background: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', border: 'none', borderRadius: 10, width: 32, height: 32, color: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {tm.running ? '⏸' : '▶'}
            </button>
            <button onClick={() => onStop(tm.id)} style={{ background: col, border: 'none', borderRadius: 10, padding: '7px 12px', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Bitir</button>
          </div>
        )
      })}
    </div>
  )
}

/* ── CI BANNER ── */
function CIBanner({ ci, tasks, onCI, dark }) {
  const td = today()
  if (tasks.some(x => x.date === td && x.done) || ci[td]) return null
  return (
    <div style={{ background: 'rgba(200,164,74,.07)', border: '.5px solid rgba(200,164,74,.2)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C8A44A', marginBottom: 2 }}>Bugün henüz aktif değilsin</div>
        <div style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.4)', lineHeight: 1.5 }}>Streak ve disiplin skorun için check-in yap.</div>
      </div>
      <button onClick={onCI} style={{ background: '#C8A44A', border: 'none', borderRadius: 12, padding: '9px 14px', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Check-in</button>
    </div>
  )
}

/* ── TASK CARD ── */
const TaskCard = React.memo(({ task, toggle, del, timers, startTimer, toggleSubtask, focusedId, setFocusedId, dark }) => {
  const pri = PRI[task.priority]
  const cat = CAT[task.cat]
  const isA = timers?.some(tm => tm.id === task.id)
  const isFocused = focusedId === task.id
  const longRef = useRef(null)
  const cardRef = useRef(null)
  const [flashing, setFlashing] = useState(false)

  const handleTouchStart = useCallback(() => {
    longRef.current = setTimeout(() => {
      setFocusedId(id => id === task.id ? null : task.id)
      haptic(8)
    }, 420)
  }, [task.id, setFocusedId])
  const handleTouchEnd = useCallback(() => clearTimeout(longRef.current), [])

  const handleToggle = useCallback(() => {
    if (isA) return
    if (!task.done) {
      setFlashing(true)
      haptic([12, 30, 8])
      setTimeout(() => setFlashing(false), 400)
    } else {
      haptic(10)
    }
    toggle(task.id)
  }, [isA, task.done, task.id, toggle])

  const bg = flashing
    ? 'rgba(27,77,62,.4)'
    : isA
      ? 'rgba(200,164,74,.05)'
      : dark
        ? 'rgba(255,255,255,.05)'
        : 'rgba(255,255,255,.7)'

  const border = flashing
    ? 'rgba(27,77,62,.6)'
    : isA
      ? 'rgba(200,164,74,.18)'
      : isFocused
        ? dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)'
        : dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: `12px 14px`,
        paddingRight: isFocused ? 96 : 14,
        display: 'flex', alignItems: 'center', gap: 11,
        position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        opacity: task.done && !flashing ? .35 : 1,
        transition: 'background .3s ease, border-color .3s ease, opacity .2s ease',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,.06)',
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: dark ? 'linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)' : 'linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: isA ? '#C8A44A' : task.done ? (dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.15)') : pri.dot, borderRadius: '0 2px 2px 0', transition: 'background .2s' }} />
      <div onClick={handleToggle}
        style={{ width: 25, height: 25, borderRadius: '50%', border: `1.5px solid ${task.done ? 'transparent' : isA ? 'rgba(200,164,74,.4)' : dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.15)'}`, background: task.done ? (dark ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.75)') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all .2s' }}>
        {task.done && <span style={{ fontSize: 10, fontWeight: 800, color: dark ? '#000' : '#fff' }}>✓</span>}
        {isA && !task.done && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C8A44A' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: task.done ? (dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)') : (dark ? '#fff' : '#000'), textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.015em' }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag color={pri.dot} bg={pri.bg}>{pri.label}</Tag>
          <Tag color={cat?.color || (dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)')}>{cat?.label || task.cat}</Tag>
          {task.dur > 0 && <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.3)' }}>⏱ {fmtM(task.dur)}</span>}
          {task.eff > 0 && !isA && <span style={{ fontSize: 9, fontWeight: 700, color: '#1B4D3E' }}>✓ {fmtS(task.eff)}</span>}
          {isA && <span style={{ fontSize: 9, color: '#C8A44A', fontWeight: 700 }}>● çalışıyor</span>}
          {task.subtasks?.length > 0 && <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} adım</span>}
        </div>
        {task.subtasks?.length > 0 && !task.done && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {task.subtasks.map((s, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); toggleSubtask && toggleSubtask(task.id, i) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <div style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px solid ${s.done ? '#1B4D3E' : (dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)')}`, background: s.done ? '#1B4D3E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.done && <span style={{ fontSize: 7, fontWeight: 800, color: '#fff' }}>✓</span>}
                </div>
                <span style={{ fontSize: 11, color: s.done ? (dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)') : (dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)'), textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {isFocused && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
          {!task.done && !isA && (
            <button onClick={e => { e.stopPropagation(); startTimer(task); setFocusedId(null) }}
              style={{ background: '#C8A44A', border: 'none', borderRadius: 11, width: 34, height: 34, color: '#000', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>▶</button>
          )}
          <button onClick={e => { e.stopPropagation(); if (!isA) { del(task.id); setFocusedId(null) } }}
            style={{ background: '#A51C30', border: 'none', borderRadius: 11, width: 34, height: 34, color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}
    </div>
  )
})

/* ── ADD SHEET ── */
function AddSheet({ onClose, add, dark }) {
  const [title, setTitle] = useState('')
  const [pri, setPri] = useState('high')
  const [cat, setCat] = useState('is')
  const [h, setH] = useState(0)
  const [m, setM] = useState(30)
  const [subtasks, setSubs] = useState([])
  const ref = useRef()
  useEffect(() => { setTimeout(() => ref.current?.focus(), 300) }, [])
  const go = () => {
    if (!title.trim()) return
    add(title.trim(), pri, cat, h * 60 + m, '', subtasks.filter(s => s.trim()).map(s => ({ text: s.trim(), done: false })))
    onClose()
  }
  const inputStyle = { background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 16, padding: '14px 16px', fontSize: 15, fontWeight: 500, color: dark ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'inherit', WebkitAppearance: 'none' }
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', zIndex: 200 }} onClick={onClose} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dark ? '#0d0d0d' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`, borderBottom: 'none', borderRadius: '28px 28px 0 0', zIndex: 201, paddingBottom: 'calc(32px + env(safe-area-inset-bottom,0px))', maxHeight: '93vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)', borderRadius: 2, margin: '13px auto 0' }} />
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', marginBottom: 18 }}>Yeni Görev</div>
          <input ref={ref} value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ne yapacaksın?" onKeyDown={e => e.key === 'Enter' && go()}
            style={{ ...inputStyle, marginBottom: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <select value={pri} onChange={e => setPri(e.target.value)} style={{ ...inputStyle, padding: '12px 14px', fontSize: 13 }}>
              <option value="high">🔴 Yüksek</option>
              <option value="med">🟡 Orta</option>
              <option value="low">🔵 Düşük</option>
            </select>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...inputStyle, padding: '12px 14px', fontSize: 13 }}>
              {Object.entries(CAT).map(([k, cv]) => <option key={k} value={k}>{cv.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', flexShrink: 0 }}>Süre:</span>
            <select value={h} onChange={e => setH(Number(e.target.value))} style={{ ...inputStyle, padding: '12px 14px', fontSize: 13, flex: 1 }}>
              {[0, 1, 2, 3, 4, 5, 6, 8].map(v => <option key={v} value={v}>{v === 0 ? '0 saat' : `${v} saat`}</option>)}
            </select>
            <select value={m} onChange={e => setM(Number(e.target.value))} style={{ ...inputStyle, padding: '12px 14px', fontSize: 13, flex: 1 }}>
              {[0, 15, 30, 45].map(v => <option key={v} value={v}>{v} dk</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Alt Görevler</div>
            {subtasks.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={s} onChange={e => { const n = [...subtasks]; n[i] = e.target.value; setSubs(n) }}
                  placeholder={`Adım ${i + 1}`} style={{ ...inputStyle, padding: '10px 14px', fontSize: 13 }} />
                <button onClick={() => setSubs(subtasks.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            ))}
            <button onClick={() => setSubs([...subtasks, ''])}
              style={{ background: 'none', border: `.5px dashed ${dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}`, borderRadius: 12, padding: '10px', fontSize: 13, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.4)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
              + Alt görev ekle
            </button>
          </div>
          <button onClick={go} style={{ background: dark ? '#fff' : '#000', border: 'none', borderRadius: 16, padding: '16px', color: dark ? '#000' : '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-.02em', width: '100%', marginBottom: 16 }}>Ekle</button>
        </div>
      </div>
    </>
  )
}

/* ── PROFILE SHEET ── */
function ProfileSheet({ profile, setProfile, onClose, dark }) {
  const [name, setName] = useState(profile.name || '')
  const AVATARS = ['🧑', '👨', '👩', '🦸', '🧙', '🦊', '🐺', '🦁', '⚡', '🔥', '💎', '🌟']
  const [av, setAv] = useState(profile.avatar || '🧑')
  const save = () => { setProfile({ name: name.trim() || 'Sen', avatar: av }); onClose() }
  const inputStyle = { background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 16, padding: '14px 16px', fontSize: 15, color: dark ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'inherit', WebkitAppearance: 'none' }
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', zIndex: 200 }} onClick={onClose} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dark ? '#0d0d0d' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`, borderBottom: 'none', borderRadius: '28px 28px 0 0', zIndex: 201, paddingBottom: 'calc(32px + env(safe-area-inset-bottom,0px))', maxHeight: '93vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)', borderRadius: 2, margin: '13px auto 0' }} />
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', marginBottom: 18 }}>Profil</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="İsmin" style={{ ...inputStyle, marginBottom: 14 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>Avatar</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAv(a)}
                style={{ width: 44, height: 44, borderRadius: 12, background: av === a ? (dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)') : (dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'), border: `1.5px solid ${av === a ? (dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)') : 'transparent'}`, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a}
              </button>
            ))}
          </div>
          <button onClick={save} style={{ background: dark ? '#fff' : '#000', border: 'none', borderRadius: 16, padding: '16px', color: dark ? '#000' : '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginBottom: 16 }}>Kaydet</button>
        </div>
      </div>
    </>
  )
}

/* ── FILTER SHEET ── */
function FilterSheet({ filter, setFilter, stats, onClose, dark }) {
  const items = [
    ['p', 'all', 'Tümü', dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)'],
    ['p', 'high', 'Yüksek', PRI.high.dot],
    ['p', 'med', 'Orta', PRI.med.dot],
    ['p', 'low', 'Düşük', PRI.low.dot],
    ...Object.entries(CAT).map(([k, c]) => ['c', k, c.label, c.color])
  ]
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', zIndex: 200 }} onClick={onClose} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dark ? '#0d0d0d' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`, borderBottom: 'none', borderRadius: '28px 28px 0 0', zIndex: 201, paddingBottom: 'calc(32px + env(safe-area-inset-bottom,0px))', maxHeight: '93vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)', borderRadius: 2, margin: '13px auto 0' }} />
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', marginBottom: 18 }}>Filtrele</div>
          {items.map(([type, val, label, color]) => {
            const on = filter.type === type && filter.value === val
            return (
              <button key={val} onClick={() => { setFilter({ type, value: val }); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '13px 14px', background: on ? (dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)') : 'transparent', border: `1px solid ${on ? (dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)') : 'transparent'}`, borderRadius: 14, marginBottom: 6, cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, opacity: on ? 1 : .4 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: on ? 600 : 400, color: on ? (dark ? '#fff' : '#000') : (dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)'), textAlign: 'left' }}>{label}</span>
                <span style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', padding: '2px 10px', borderRadius: 99 }}>{stats.counts[val] || 0}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ── HEADER ── */
function Header({ view, profile, stats, discScore, onProfile, onFilter, onAdd, onAI, hasAI, dark, toggleDark }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: dark ? 'rgba(0,0,0,.0)' : 'rgba(242,242,247,.0)', paddingTop: 'env(safe-area-inset-top,0px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', lineHeight: 1 }}>
            Up<span style={{ color: 'rgba(128,128,128,.35)' }}>.</span>
          </div>
          {stats.streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,159,10,.08)', border: '.5px solid rgba(255,159,10,.2)', borderRadius: 99, padding: '5px 10px' }}>
              <span style={{ fontSize: 12, lineHeight: 1 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ff9f0a' }}>{stats.streak}</span>
            </div>
          )}
          {discScore > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)', border: `.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 99, padding: '5px 10px' }}>
              <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', lineHeight: 1 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)' }}>{discScore}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={toggleDark}
            style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)', border: `.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 13, padding: '9px 11px', fontSize: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', lineHeight: 1 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={onAI}
            style={{ position: 'relative', background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)', border: `.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 13, padding: '9px 11px', fontSize: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', lineHeight: 1 }}>
            🤖
            {hasAI && <div style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#0a84ff', border: '1.5px solid ' + (dark ? '#000' : '#f2f2f7') }} />}
          </button>
          {view === 'day' && (
            <button onClick={onFilter}
              style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)', border: `.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 13, padding: '9px 11px', color: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', fontSize: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', lineHeight: 1 }}>
              ☰
            </button>
          )}
          {view === 'day' && (
            <button onClick={onAdd}
              style={{ background: dark ? '#fff' : '#000', border: 'none', borderRadius: 13, padding: '10px 18px', color: dark ? '#000' : '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', lineHeight: 1, fontFamily: 'inherit' }}>
              +
            </button>
          )}
          <button onClick={onProfile}
            style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)', border: `.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 13, padding: '9px 11px', fontSize: 16, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', lineHeight: 1 }}>
            {profile.avatar}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── AI COACH CARD ── */
function AICoachCard({ message, type, onRefresh, onDismiss, loading, dark }) {
  const icons = { morning: '☀️', streak: '⚡', weekly: '📊' }
  const titles = { morning: 'Sabah Mesajı', streak: 'Streak Uyarısı', weekly: 'Haftalık Özet' }
  const bgs = { morning: 'linear-gradient(135deg,rgba(44,62,107,.2),rgba(110,60,255,.1))', streak: 'rgba(200,164,74,.08)', weekly: 'rgba(27,77,62,.12)' }
  const borders = { morning: 'rgba(44,62,107,.3)', streak: 'rgba(200,164,74,.2)', weekly: 'rgba(27,77,62,.25)' }
  return (
    <div style={{ background: bgs[type], border: `.5px solid ${borders[type]}`, borderRadius: 18, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icons[type]}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>{titles[type]}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRefresh && <button onClick={onRefresh} style={{ background: 'none', border: 'none', color: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)', fontSize: 14, cursor: 'pointer', padding: '2px 6px' }}>↻</button>}
          {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)', fontSize: 18, cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}>×</button>}
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.2)', animation: `breathe 1.2s ${i * .2}s infinite` }} />)}
          <span style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>Düşünüyor...</span>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.65)', lineHeight: 1.65, letterSpacing: '-.01em' }}>{message}</div>
      )}
    </div>
  )
}

/* ── DAY VIEW ── */
function DayView({ tasks, filter, toggle, del, timers, startTimer, toggleSubtask, ci, onCI, stats, onAdd, dark }) {
  const [focusedId, setFocusedId] = useState(null)
  const td = today()
  const now = new Date()
  const prevPct = useRef(0)

  useEffect(() => {
    if (prevPct.current < 100 && stats.pct === 100 && stats.totalT > 0) {
      haptic([10, 60, 20, 40, 10])
    }
    prevPct.current = stats.pct
  }, [stats.pct, stats.totalT])

  const filtered = useMemo(() => {
    const base = tasks.filter(x => x.date === td)
    let r = base
    if (filter.type === 'p' && filter.value !== 'all') r = base.filter(x => x.priority === filter.value)
    else if (filter.type === 'c') r = base.filter(x => x.cat === filter.value)
    return r
  }, [tasks, filter, td])

  const effToday = useMemo(() =>
    tasks.filter(x => x.date === td && x.done && x.eff).reduce((s, x) => s + Math.round(x.eff / 60), 0)
    , [tasks, td])

  const bgTap = useCallback(e => {
    if (focusedId && !e.target.closest('[data-task]')) setFocusedId(null)
  }, [focusedId])

  const StatCard = ({ val, lbl }) => (
    <div style={{ flex: 1, background: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)', border: `1px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`, borderRadius: 14, padding: '9px 10px', backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.65)', lineHeight: 1, letterSpacing: '-.02em' }}>{val}</div>
      <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)', marginTop: 3 }}>{lbl}</div>
    </div>
  )

  const GroupSep = ({ from, to }) => (
    <div style={{ height: 10, margin: '2px 0', display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1, height: 1, borderRadius: 1, opacity: .3, background: `linear-gradient(90deg,${from},${to})` }} />
    </div>
  )

  const groups = [
    { key: 'high', pri: PRI.high },
    { key: 'med', pri: PRI.med },
    { key: 'low', pri: PRI.low },
  ]

  const separators = [
    { from: '#A51C30', to: '#1B4D3E' },
    { from: '#1B4D3E', to: '#2C3E6B' },
  ]

  if (!filtered.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh' }} onClick={bgTap}>
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 80, fontWeight: 800, color: dark ? '#fff' : '#000', lineHeight: 1, letterSpacing: '-.06em' }}>
            0<sup style={{ fontSize: 28, color: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)', verticalAlign: 'super' }}>%</sup>
          </div>
          <div style={{ paddingBottom: 8, textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}>
              <strong style={{ color: dark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.8)', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1 }}>0</strong>tamamlandı
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, padding: '12px 0 0' }}>
          <StatCard val="—" lbl="Efor" />
          <StatCard val="—" lbl="Seri" />
          <StatCard val={DAYS_L[now.getDay()]} lbl={`${now.getDate()} ${MONS[now.getMonth()]}`} />
        </div>
        <div style={{ height: .5, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)', margin: '14px 0 0' }} />
        <CIBanner ci={ci} tasks={tasks} onCI={onCI} dark={dark} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', marginBottom: 10 }}>Bugün ne yapacaksın?</div>
        <div style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)', lineHeight: 1.6, marginBottom: 36 }}>İlk görevini ekle.<br />Küçük bir adım bile yeterli.</div>
        <div onClick={onAdd}
          onTouchStart={e => { e.currentTarget.style.opacity = '.6' }}
          onTouchEnd={e => { e.currentTarget.style.opacity = '1' }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`, borderRadius: 22, padding: '15px 20px', cursor: 'pointer', backdropFilter: 'blur(20px)', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: dark ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#000' : '#fff', fontSize: 18, fontWeight: 300, lineHeight: 1 }}>+</div>
          <div style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.4)' }}>Yeni görev ekle</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} onTouchStart={bgTap}>
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 80, fontWeight: 800, color: dark ? '#fff' : '#000', lineHeight: 1, letterSpacing: '-.06em' }}>
            {stats.pct}<sup style={{ fontSize: 28, color: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)', verticalAlign: 'super', letterSpacing: 0 }}>%</sup>
          </div>
          <div style={{ paddingBottom: 8, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', lineHeight: 1.5 }}>
              <strong style={{ color: dark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.8)', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1 }}>{stats.doneT}</strong>tamamlandı
            </div>
            <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', lineHeight: 1.5 }}>
              <strong style={{ color: dark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.8)', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1 }}>{stats.totalT - stats.doneT}</strong>kaldı
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, padding: '12px 0 0' }}>
          <StatCard val={effToday > 0 ? fmtM(effToday) : '—'} lbl="Efor" />
          <StatCard val={stats.streak > 0 ? `🔥 ${stats.streak}` : '—'} lbl="Seri" />
          <StatCard val={DAYS_L[now.getDay()]} lbl={`${now.getDate()} ${MONS[now.getMonth()]}`} />
        </div>
        <div style={{ padding: '12px 0 0' }}>
          <div style={{ height: 2, background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.pct}%`, background: dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)', borderRadius: 1, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)', fontWeight: 500 }}>0%</span>
            <strong style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.45)', fontWeight: 600 }}>{stats.pct}% tamamlandı</strong>
            <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)', fontWeight: 500 }}>100%</span>
          </div>
        </div>
        <div style={{ height: .5, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)', margin: '14px 0 0' }} />
        <CIBanner ci={ci} tasks={tasks} onCI={onCI} dark={dark} />
      </div>

      {groups.map(({ key, pri }, gi) => {
        const list = filtered.filter(x => x.priority === key).sort((a, b) => a.done - b.done || a.id - b.id)
        if (!list.length) return null
        return (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 2px 6px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: pri.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.28)' }}>{pri.label}</span>
              <div style={{ flex: 1, height: .5, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)' }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.22)' }}>{list.filter(x => x.done).length}/{list.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map(x => (
                <TaskCard key={x.id} task={x} toggle={toggle} del={del}
                  timers={timers} startTimer={startTimer} toggleSubtask={toggleSubtask}
                  focusedId={focusedId} setFocusedId={setFocusedId} dark={dark} />
              ))}
            </div>
            {gi < separators.length && filtered.some(x => x.priority === groups[gi + 1]?.key) && (
              <GroupSep from={separators[gi].from} to={separators[gi].to} />
            )}
          </div>
        )
      })}

      <div onClick={onAdd}
        onTouchStart={e => { e.currentTarget.style.opacity = '.6' }}
        onTouchEnd={e => { e.currentTarget.style.opacity = '1' }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)', border: `1px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`, borderRadius: 20, padding: '13px 16px', cursor: 'pointer', marginTop: 10, backdropFilter: 'blur(20px)', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: dark ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#000' : '#fff', fontSize: 17, fontWeight: 300, lineHeight: 1, flexShrink: 0 }}>+</div>
        <div style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.4)', fontWeight: 400 }}>Yeni görev ekle</div>
      </div>
    </div>
  )
}

/* ── APP ── */
export default function App() {
  const [dark, setDark] = useTheme()
  const [splash, setSplash] = useState(true)
  const [tasks, setTasks] = useState(() => ld(SK.tasks, []))
  const [journal, setJournal] = useState(() => ld(SK.jrnl, {}))
  const [profile, setProfile] = useState(() => ld(SK.prof, { name: 'Sen', avatar: '🧑' }))
  const [board, setBoard] = useState(() => ld(SK.brd, defBoard()))
  const [ci, setCi] = useState(() => ld(SK.ci, {}))
  const [view, setView] = useState('day')
  const [filter, setFilter] = useState({ type: 'p', value: 'all' })
  const [now, setNow] = useState(new Date())
  const [timers, setTimers] = useState([])
  const tmrIntervalsRef = useRef({})
  const [showAdd, setShowAdd] = useState(false)
  const [showProf, setShowProf] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const saveRef = useRef(null)

  const [aiMorning, setAiMorning] = useState(null)
  const [aiMorningLoading, setAiMorningLoading] = useState(false)
  const [aiMorningDismissed, setAiMorningDismissed] = useState(false)
  const [aiStreakMsg, setAiStreakMsg] = useState(null)
  const [aiWeekly, setAiWeekly] = useState(null)
  const [aiWeeklyLoading, setAiWeeklyLoading] = useState(false)
  const [aiWeeklyDismissed, setAiWeeklyDismissed] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  useEffect(() => { clearTimeout(saveRef.current); saveRef.current = setTimeout(() => sv(SK.tasks, tasks), 500) }, [tasks])
  useEffect(() => sv(SK.jrnl, journal), [journal])
  useEffect(() => sv(SK.prof, profile), [profile])
  useEffect(() => sv(SK.brd, board), [board])
  useEffect(() => sv(SK.ci, ci), [ci])
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id) }, [])

  const td = useMemo(() => ds(now), [now])

  const stats = useMemo(() => {
    const todayTasks = tasks.filter(x => x.date === td)
    const doneT = todayTasks.filter(x => x.done).length
    const totalT = todayTasks.length
    const pct = totalT ? Math.round(doneT / totalT * 100) : 0
    const doneAll = tasks.filter(x => x.done).length
    const totalAll = tasks.length
    const streak = calcStreak({ tasks, ci })
    const mon = getMon(now)
    const weekTasks = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return ds(d) }).flatMap(d => tasks.filter(x => x.date === d))
    const weekDone = weekTasks.filter(x => x.done).length
    const weekPct = weekTasks.length ? Math.round(weekDone / weekTasks.length * 100) : 0
    const effToday = todayTasks.filter(x => x.done && x.eff).reduce((s, x) => s + Math.round(x.eff / 60), 0)
    const effWeek = weekTasks.filter(x => x.done && x.eff).reduce((s, x) => s + Math.round(x.eff / 60), 0)
    const counts = { all: totalT, high: todayTasks.filter(x => x.priority === 'high').length, med: todayTasks.filter(x => x.priority === 'med').length, low: todayTasks.filter(x => x.priority === 'low').length }
    Object.keys(CAT).forEach(k => { counts[k] = todayTasks.filter(x => x.cat === k).length })
    return { pct, doneT, totalT, doneAll, totalAll, streak, weekPct, effToday, effWeek, counts }
  }, [tasks, ci, now, td])

  const discScore = useMemo(() => calcDisc({ tasks, ci, streak: stats.streak, now }), [tasks, ci, stats.streak, now])

  const addTask = useCallback((title, priority, cat, dur, time = '', subtasks = []) => {
    setTasks(p => [...p, { id: Date.now() + Math.random(), title, priority, cat, dur: dur || 0, done: false, date: td, time, eff: 0, subtasks }])
  }, [td])
  const toggleTask = useCallback(id => { setTasks(p => p.map(x => x.id === id ? { ...x, done: !x.done } : x)) }, [])
  const deleteTask = useCallback(id => { setTasks(p => p.filter(x => x.id !== id)) }, [])
  const toggleSubtask = useCallback((taskId, idx) => { setTasks(p => p.map(x => x.id === taskId ? { ...x, subtasks: x.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s) } : x)) }, [])
  const doCI = useCallback(() => { setCi(p => ({ ...p, [ds(now)]: true })) }, [now])

  const startTimer = useCallback(task => {
    const id = task.id
    if (timers.some(t => t.id === id)) return
    setTimers(prev => [...prev, { id, title: task.title, elapsed: 0, running: true, dur: task.dur }])
    tmrIntervalsRef.current[id] = setInterval(() => {
      setTimers(prev => prev.map(t => t.id === id ? { ...t, elapsed: t.elapsed + 1 } : t))
    }, 1000)
  }, [timers])

  const pauseTimer = useCallback(taskId => {
    clearInterval(tmrIntervalsRef.current[taskId])
    delete tmrIntervalsRef.current[taskId]
    setTimers(prev => prev.map(t => t.id === taskId ? { ...t, running: false } : t))
  }, [])

  const resumeTimer = useCallback(taskId => {
    setTimers(prev => prev.map(t => t.id === taskId ? { ...t, running: true } : t))
    tmrIntervalsRef.current[taskId] = setInterval(() => {
      setTimers(prev => prev.map(t => t.id === taskId ? { ...t, elapsed: t.elapsed + 1 } : t))
    }, 1000)
  }, [])

  const stopTimer = useCallback(taskId => {
    const tm = timers.find(t => t.id === taskId)
    if (!tm) return
    if (tm.elapsed > 0) { setTasks(p => p.map(x => x.id === taskId ? { ...x, done: true, eff: tm.elapsed } : x)) }
    clearInterval(tmrIntervalsRef.current[taskId])
    delete tmrIntervalsRef.current[taskId]
    setTimers(prev => prev.filter(t => t.id !== taskId))
  }, [timers])

  const changeView = useCallback(v => setView(v), [])
  const navH = 62 + 20
  const timerH = timers.length > 0 ? Math.min(timers.length, 3) * 60 : 0
  const contentPb = navH + timerH + 16

  const AIPanel = () => (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', zIndex: 200 }} onClick={() => setShowAiPanel(false)} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dark ? '#0d0d0d' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`, borderBottom: 'none', borderRadius: '28px 28px 0 0', zIndex: 201, paddingBottom: 'calc(32px + env(safe-area-inset-bottom,0px))', maxHeight: '93vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)', borderRadius: 2, margin: '13px auto 0' }} />
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: dark ? '#fff' : '#000', letterSpacing: '-.04em', marginBottom: 4 }}>YZ Koçun</div>
          <div style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.4)', marginBottom: 20 }}>Verilerine dayalı kişisel analizin</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiMorning && (
              <AICoachCard message={aiMorning} type="morning" dark={dark}
                onRefresh={() => { setAiMorning(null); setAiMorningLoading(true); const ctx = buildUserContext({ tasks, journal, stats, discScore, now, profile }); callAI('Sen UP. uygulamasının kişisel YZ koçusun. Kısa, samimi, motive edici Türkçe. Max 2-3 cümle.', `${ctx}\n\nSabah mesajı yaz.`).then(m => { setAiMorning(m); setAiMorningLoading(false) }) }}
                onDismiss={() => { setAiMorning(null); setAiMorningDismissed(true) }}
                loading={aiMorningLoading} />
            )}
            {aiStreakMsg && (
              <AICoachCard message={aiStreakMsg} type="streak" dark={dark}
                onRefresh={() => setAiStreakMsg(null)} onDismiss={() => setAiStreakMsg(null)} loading={false} />
            )}
            {(aiWeekly || aiWeeklyLoading) && !aiWeeklyDismissed && (
              <AICoachCard message={aiWeekly} type="weekly" dark={dark}
                onRefresh={() => { setAiWeekly(null); setAiWeeklyLoading(true); const ctx = buildUserContext({ tasks, journal, stats, discScore, now, profile }); callAI('Sen UP. uygulamasının YZ koçusun. Haftalık özet. 3-4 cümle Türkçe.', `${ctx}\n\nHaftalık özet yaz.`).then(m => { setAiWeekly(m); setAiWeeklyLoading(false) }) }}
                onDismiss={() => { setAiWeekly(null); setAiWeeklyDismissed(true) }}
                loading={aiWeeklyLoading} />
            )}
            <button onClick={async () => {
              const ctx = buildUserContext({ tasks, journal, stats, discScore, now, profile })
              const msg = await callAI('Sen UP. uygulamasının YZ koçusun. 4-5 cümle, içgörülü, Türkçe.', `${ctx}\n\nKullanıcının güçlü ve zayıf yönlerini analiz et.`)
              if (msg) setAiMorning(msg)
            }} style={{ background: 'rgba(44,62,107,.6)', border: '1px solid rgba(44,62,107,.8)', borderRadius: 16, padding: '15px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
              🔍 Şu An Analiz Et
            </button>
          </div>
          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  )

  return (
    <div style={{ background: dark ? '#000' : '#f2f2f7', color: dark ? '#fff' : '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: "'DM Sans',-apple-system,sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <OpalBg dark={dark} />
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {showAiPanel && <AIPanel />}
      {showAdd && <AddSheet onClose={() => setShowAdd(false)} add={addTask} dark={dark} />}
      {showProf && <ProfileSheet profile={profile} setProfile={setProfile} onClose={() => setShowProf(false)} dark={dark} />}
      {showFilter && <FilterSheet filter={filter} setFilter={setFilter} stats={stats} onClose={() => setShowFilter(false)} dark={dark} />}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Header view={view} profile={profile} stats={stats} discScore={discScore}
          onProfile={() => setShowProf(true)} onFilter={() => setShowFilter(true)}
          onAdd={() => setShowAdd(true)} onAI={() => setShowAiPanel(true)}
          hasAI={!!(aiMorning || aiStreakMsg || aiWeekly)} dark={dark} toggleDark={() => setDark(d => !d)} />

        {timers.length > 0 && <TimerFloat timers={timers} onPause={pauseTimer} onResume={resumeTimer} onStop={stopTimer} dark={dark} />}

        <div style={{ flex: 1, padding: `0 20px ${contentPb}px`, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
          {view === 'day' && (
            <DayView tasks={tasks} filter={filter} toggle={toggleTask} del={deleteTask}
              timers={timers} startTimer={startTimer} toggleSubtask={toggleSubtask}
              ci={ci} onCI={doCI} stats={stats} onAdd={() => setShowAdd(true)} dark={dark} />
          )}
          {view === 'week' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Hafta görünümü yakında</div>}
          {view === 'month' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Ay görünümü yakında</div>}
          {view === 'disc' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Disiplin görünümü yakında</div>}
          {view === 'stats' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Analiz görünümü yakında</div>}
          {view === 'journal' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Günlük görünümü yakında</div>}
          {view === 'board' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Sıralama görünümü yakında</div>}
          {view === 'journey' && <div style={{ padding: '40px 0', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', textAlign: 'center', fontSize: 14 }}>Yolculuk görünümü yakında</div>}
        </div>

        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dark ? 'rgba(0,0,0,.88)' : 'rgba(242,242,247,.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderTop: `.5px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)'}`, display: 'flex', padding: `7px 4px calc(env(safe-area-inset-bottom,0px) + 7px)`, zIndex: 100 }}>
          {(() => {
            const mon = getMon(now)
            const monEnd = new Date(mon); monEnd.setDate(mon.getDate() + 6)
            const todayMood = journal[td]?.mood
            const sorted = [...board].sort((a, b) => b.disc - a.disc)
            const myRank = sorted.findIndex(u => u.me) + 1
            const startD = (() => { const k = 'up_start_v2'; let d = localStorage.getItem(k); if (!d) { d = new Date().toISOString(); localStorage.setItem(k, d); } return new Date(d) })()
            const rem = Math.max(0, startD.getTime() + 90 * 86400 * 1000 - now.getTime())
            const remDays = Math.floor(rem / 86400000)
            const navItems = [
              { id: 'day', val: now.getDate().toString(), label: 'Bugün' },
              { id: 'week', val: `${mon.getDate()}-${monEnd.getDate()}`, label: 'Hafta' },
              { id: 'month', val: MONS[now.getMonth()].slice(0, 3), label: 'Ay' },
              { id: 'disc', val: discScore > 0 ? `${discScore}` : '—', label: 'Disiplin' },
              { id: 'stats', val: stats.pct > 0 ? `${stats.pct}%` : '—', label: 'Analiz' },
              { id: 'journal', val: todayMood ? MOOD_E[todayMood] : '?', label: 'Günlük' },
              { id: 'board', val: myRank > 0 ? `${myRank}.` : '—', label: 'Sıralama' },
              { id: 'journey', val: rem === 0 ? '✓' : `${remDays}g`, label: 'Yolculuk' },
            ]
            return navItems.map(v => (
              <button key={v.id} onClick={() => changeView(v.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer', color: view === v.id ? (dark ? '#fff' : '#000') : (dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.3)'), position: 'relative', WebkitTapHighlightColor: 'transparent', transition: 'color .15s' }}>
                {view === v.id && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, background: dark ? '#fff' : '#000', borderRadius: '0 0 2px 2px', opacity: .6 }} />}
                <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{v.val}</span>
                <span style={{ fontSize: 6, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', opacity: .55 }}>{v.label}</span>
              </button>
            ))
          })()}
        </nav>
      </div>
    </div>
  )
}