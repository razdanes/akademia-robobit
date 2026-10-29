import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'

const MODES = [
  { id: 'letters', label: 'Litery', icon: '🔤', pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), info: 'Wszystkie litery od A do Z.' },
  { id: 'digits', label: 'Cyfry', icon: '🔢', pool: '0123456789'.split(''), info: 'Cyfry z górnego rzędu.' },
  { id: 'home', label: 'Rząd domowy', icon: '🏠', pool: 'ASDFGHJKL'.split(''), info: 'Tu zawsze leżą Twoje palce.' },
  { id: 'words', label: 'Słowa', icon: '📝', pool: ['KOT', 'DOM', 'PIES', 'LAS', 'ROBOT', 'MAMA', 'TATA', 'LATO', 'MYSZ', 'KOD', 'GRA', 'BIT'], info: 'Pisz całe słowa literka po literce.' },
]
const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
const FNAMES = ['lewy mały', 'lewy serdeczny', 'lewy środkowy', 'lewy wskazujący', 'prawy wskazujący', 'prawy środkowy', 'prawy serdeczny', 'prawy mały']
const FCOL = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#a78bfa', '#f87171']
const FING: Record<string, number> = {}
;['1QAZ', '2WSX', '3EDC', '45RTFGVB', '67YUHJNM', '8IK', '9OL', '0P'].forEach((g, i) => [...g].forEach(c => (FING[c] = i)))
const TIME = 30
const pick = (pool: string[], prev = '') => { let w = prev; while (w === prev && pool.length > 1) w = pool[Math.floor(Math.random() * pool.length)]; return w }
const bestKey = (id: string) => `robobit-kb-best-${id}`
const getBest = (id: string) => { try { return +(localStorage.getItem(bestKey(id)) || 0) } catch { return 0 } }

export default function KeyboardGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [mode, setMode] = useState(MODES[0]), [item, setItem] = useState(''), [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0), [streak, setStreak] = useState(0), [maxStreak, setMax] = useState(0), [errors, setErrors] = useState(0)
  const [left, setLeft] = useState(TIME), [run, setRun] = useState(false), [fin, setFin] = useState(false), [bad, setBad] = useState(''), [stars, setStars] = useState(0), [newBest, setNewBest] = useState(false)

  const start = (m = mode) => { setMode(m); setItem(pick(m.pool)); setIdx(0); setScore(0); setStreak(0); setMax(0); setErrors(0); setLeft(TIME); setFin(false); setNewBest(false); setRun(true) }
  useEffect(() => { if (!run) return; const t = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(t) }, [run])
  useEffect(() => {
    if (!run || left > 0) return
    setRun(false); setFin(true)
    const total = score + errors, acc = total ? score / total : 0
    const st = score >= 15 && acc >= .9 ? 3 : score >= 8 ? 2 : 1
    setStars(st); onEnd(st)
    if (score > getBest(mode.id)) { setNewBest(true); try { localStorage.setItem(bestKey(mode.id), String(score)) } catch {} }
    playVoice(score >= 8 ? 'kb_good' : 'kb_try')
  }, [left])

  const press = (raw: string) => {
    if (!run) return
    const c = raw.toUpperCase()
    if (c === item[idx]) {
      click(700 + idx * 80); setScore(s => s + 1); setStreak(s => { const n = s + 1; setMax(m => Math.max(m, n)); return n })
      if (idx + 1 >= item.length) { setItem(pick(mode.pool, item)); setIdx(0) } else setIdx(idx + 1)
    } else { click(180); setErrors(e => e + 1); setStreak(0); setBad(c); setTimeout(() => setBad(''), 300) }
  }
  useEffect(() => { if (run && item) playSeq(['kb_press', item.length > 1 ? `kb_word_${item}` : `kb_char_${item}`]) }, [item, run])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key.length === 1) press(e.key) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })

  const target = item[idx], acc = score + errors ? Math.round(100 * score / (score + errors)) : 100
  return (
    <div className="mx-auto max-w-3xl p-4 text-center">
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <RoboBit voice={!run && !fin ? 'kb_pick' : undefined} say={fin ? `Koniec! Wpisałeś ${score} znaków.` : run ? (streak >= 5 ? `Seria ${streak}! Super!` : `Naciśnij ${target} palcem: ${FNAMES[FING[target]] ?? ''}.`) : 'Wybierz, czego chcesz ćwiczyć!'} />

      {!run && !fin && <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MODES.map(m => <motion.button key={m.id} whileTap={{ scale: .96 }} onClick={() => start(m)} className="rounded-2xl bg-emerald-600 p-4 text-left shadow-lg">
          <div className="text-2xl font-extrabold">{m.icon} {m.label}</div><div className="text-slate-100">{m.info}</div>
          <div className="mt-1 text-sm text-yellow-200">Rekord: {getBest(m.id)}</div></motion.button>)}
      </div>}

      {fin && <div className="mt-6 rounded-3xl bg-white/10 p-6">
        <div className="text-5xl">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        <div className="mt-2 text-3xl font-extrabold">{score} znaków {newBest && '🏆 Nowy rekord!'}</div>
        <div className="mt-1 text-lg">Dokładność: {acc}% · Najdłuższa seria: {maxStreak}</div>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => start()} className="rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">Jeszcze raz</button>
          <button onClick={() => setFin(false)} className="rounded-full bg-white/20 px-6 py-3 text-xl">Zmień tryb</button></div>
      </div>}

      {run && <>
        <div className="mt-4 flex justify-between text-xl font-bold"><span>⭐ {score}</span><span>🔥 {streak}</span><span>🎯 {acc}%</span><span>⏱️ {left}s</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-yellow-300 transition-all duration-1000 ease-linear" style={{ width: `${100 * left / TIME}%` }} /></div>
        <motion.div key={bad} animate={bad ? { x: [-10, 10, -8, 8, 0] } : {}} className={`mx-auto my-5 flex min-h-[8rem] w-fit min-w-[8rem] items-center justify-center rounded-3xl px-6 text-7xl font-extrabold tracking-widest shadow-2xl ${bad ? 'bg-red-400' : 'bg-yellow-300'} text-slate-900`}>
          {[...item].map((c, i) => <span key={i} className={i < idx ? 'text-emerald-600' : ''}>{c}</span>)}
        </motion.div>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1">
          {ROWS.map((row, ri) => <div key={row} className="flex gap-1" style={{ marginLeft: ri * 14 }}>
            {[...row].map(k => <motion.button key={k} onClick={() => press(k)} whileTap={{ scale: .9 }} animate={k === target ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}
              className={`h-10 w-8 rounded-lg text-lg font-bold text-slate-900 sm:h-12 sm:w-11 ${k === target ? 'ring-4 ring-white' : 'opacity-60'} ${k === bad ? 'ring-4 ring-red-500' : ''}`}
              style={{ background: FCOL[FING[k]] }}>{k}</motion.button>)}
          </div>)}
        </div>
        <p className="mt-3 text-slate-300">Kolor klawisza pokazuje, którym palcem go naciskać{target && FING[target] !== undefined ? `: ${FNAMES[FING[target]]}` : ''}.</p>
      </>}
    </div>
  )
}
