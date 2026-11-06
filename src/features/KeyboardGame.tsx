import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import { click } from '../audio'
import { playSeq, playVoice } from '../voice'

const POL: Record<string, string> = { a: 'ą', c: 'ć', e: 'ę', l: 'ł', n: 'ń', o: 'ó', s: 'ś', x: 'ź', z: 'ż' }   // układ „polski programisty”: AltGr + litera
const POLR: Record<string, string> = Object.fromEntries(Object.entries(POL).map(([k, v]) => [v, k]))
const SH: Record<string, string> = { '1': '!', '2': '@', '3': '#', '9': '(', '0': ')', '/': '?', ';': ':', '-': '_' }
const SHR: Record<string, string> = Object.fromEntries(Object.entries(SH).map(([k, v]) => [v, k]))
const ROWS = ['1234567890-', 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./']
const FNAMES = ['lewy mały', 'lewy serdeczny', 'lewy środkowy', 'lewy wskazujący', 'prawy wskazujący', 'prawy środkowy', 'prawy serdeczny', 'prawy mały']
const FCOL = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#a78bfa', '#f87171']
const FING: Record<string, number> = {}
;['1qaz', '2wsx', '3edc', '45rtfgvb', '67yuhjnm', '8ik,', '9ol.', '0p-;/'].forEach((g, i) => [...g].forEach(c => (FING[c] = i)))

interface Item { text: string; label: string; ci: boolean; ctrl?: boolean; desc?: string }
interface Mode { id: string; label: string; icon: string; info: string; tip: string; make: () => Item[] }
const pickN = <T,>(a: T[], n: number) => { const r: T[] = []; while (r.length < n) { const x = a[Math.floor(Math.random() * a.length)]; if (x !== r[r.length - 1]) r.push(x) } return r }
const chars = (s: string, ci = true): Item[] => pickN([...s], 8).map(c => ({ text: c, label: ci ? c.toUpperCase() : c, ci }))
const SC: [string, string][] = [['c', 'Kopiuj'], ['v', 'Wklej'], ['x', 'Wytnij'], ['z', 'Cofnij'], ['a', 'Zaznacz wszystko'], ['s', 'Zapisz']]
const WORDS = ['kot', 'dom', 'pies', 'las', 'robot', 'mama', 'tata', 'lato', 'mysz', 'kod', 'gra', 'bit']
const MODES: Mode[] = [
  { id: 'letters', label: 'Litery', icon: '🔤', info: '8 liter', tip: 'Naciśnij literę, którą widzisz. Możesz pisać małe litery.', make: () => chars('abcdefghijklmnopqrstuvwxyz') },
  { id: 'digits', label: 'Cyfry', icon: '🔢', info: '8 cyfr', tip: 'Cyfry są w górnym rzędzie klawiatury.', make: () => chars('0123456789') },
  { id: 'home', label: 'Rząd domowy', icon: '🏠', info: 'Tu leżą Twoje palce', tip: 'Rząd domowy to miejsce, w którym zawsze odpoczywają Twoje palce.', make: () => chars('asdfghjkl') },
  { id: 'case', label: 'Mała i duża litera', icon: '🔠', info: 'Klawisz Shift', tip: 'Mała litera: sam klawisz. Duża litera: przytrzymaj Shift i naciśnij literę.', make: () => chars('aAbBcCdDeEfFgGkKmMoOpPrRsStTwWzZ', false) },
  { id: 'polish', label: 'Polskie litery', icon: '🇵🇱', info: 'ą ę ć ś ż…', tip: 'Polskie litery: przytrzymaj prawy Alt (AltGr) i naciśnij literę. AltGr + A daje ą.', make: () => chars('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', false) },
  { id: 'special', label: 'Znaki specjalne', icon: '❗', info: '! ? @ # ( )', tip: 'Wiele znaków pisze się z Shiftem. Na przykład Shift + 1 daje wykrzyknik.', make: () => chars('!?.,:;@#-()', false) },
  { id: 'shortcuts', label: 'Skróty klawiszowe', icon: '⌨️', info: 'Ctrl + C, V, Z…', tip: 'Skrót to dwa klawisze naraz: przytrzymaj Ctrl i naciśnij literę.', make: () => [...SC].sort(() => Math.random() - .5).map(([k, d]) => ({ text: k, label: `Ctrl + ${k.toUpperCase()}`, ci: true, ctrl: true, desc: d })) },
  { id: 'words', label: 'Słowa', icon: '📝', info: '6 słów', tip: 'Pisz całe słowa literka po literce.', make: () => pickN(WORDS, 6).map(w => ({ text: w, label: w.toUpperCase(), ci: true })) },
]
function plan(ch: string) {
  const low = ch.toLowerCase()
  if (POLR[low]) return { key: POLR[low], shift: ch !== low, altgr: true }
  if (SHR[ch]) return { key: SHR[ch], shift: true, altgr: false }
  if (/[a-z]/i.test(ch)) return { key: low, shift: ch !== low, altgr: false }
  return { key: ch, shift: false, altgr: false }
}
const hintFor = (it: Item, pos: number) => {
  if (it.ctrl) return `Przytrzymaj Ctrl i naciśnij ${it.text.toUpperCase()}${it.desc ? ` – ${it.desc.toLowerCase()}` : ''}.`
  const p = plan(it.text[pos]), mods = [p.altgr && 'prawy Alt (AltGr)', p.shift && 'Shift'].filter(Boolean)
  return mods.length ? `Przytrzymaj ${mods.join(' i ')} i naciśnij ${p.key.toUpperCase()}.` : `Naciśnij ${p.key.toUpperCase()} palcem: ${FNAMES[FING[p.key]] ?? ''}.`
}
const bestKey = (id: string) => `robobit-kb-best-${id}`
const best = (id: string) => { try { return +(localStorage.getItem(bestKey(id)) || 0) } catch { return 0 } }
const VOICED = ['letters', 'digits', 'home', 'words']

export default function KeyboardGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [mode, setMode] = useState(MODES[0]), [items, setItems] = useState<Item[]>([]), [idx, setIdx] = useState(0), [pos, setPos] = useState(0)
  const [errors, setErrors] = useState(0), [secs, setSecs] = useState(0), [run, setRun] = useState(false), [fin, setFin] = useState(false), [stars, setStars] = useState(0), [bad, setBad] = useState(0)
  const [mods, setMods] = useState({ shift: false, altgr: false, ctrl: false }), [msg, setMsg] = useState('')
  const it = items[idx]
  const start = (m: Mode) => { setMode(m); setItems(m.make()); setIdx(0); setPos(0); setErrors(0); setSecs(0); setFin(false); setMods({ shift: false, altgr: false, ctrl: false }); setMsg(m.tip); setRun(true) }
  useEffect(() => { if (!run) return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t) }, [run])
  useEffect(() => { if (run && it && VOICED.includes(mode.id)) playSeq(['kb_press', it.text.length > 1 ? `kb_word_${it.text.toUpperCase()}` : `kb_char_${it.text.toUpperCase()}`]) }, [idx, run])

  const submit = (ch: string, ctrl: boolean) => {
    if (!run || !it) return
    const okKey = it.ctrl ? ctrl && ch.toLowerCase() === it.text : !ctrl && (it.ci ? ch.toLowerCase() === it.text[pos].toLowerCase() : ch === it.text[pos])
    if (!okKey) { click(180); setErrors(e => e + 1); setBad(b => b + 1); setMsg(it.ctrl && !ctrl ? 'Najpierw przytrzymaj Ctrl, potem naciśnij literę.' : hintFor(it, pos)); return }
    click(700 + pos * 80); setMsg('Dobrze!')
    if (pos + 1 < it.text.length) { setPos(pos + 1); return }
    if (idx + 1 < items.length) { setIdx(idx + 1); setPos(0); return }
    const st = errors <= 1 ? 3 : errors <= 3 ? 2 : 1
    setRun(false); setFin(true); setStars(st); onEnd(st); playVoice(st >= 2 ? 'kb_good' : 'kb_try')
    try { if (st > best(mode.id)) localStorage.setItem(bestKey(mode.id), String(st)) } catch {}
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!run || e.key.length !== 1) return
      const ctrl = (e.ctrlKey || e.metaKey) && !e.altKey   // AltGr w Windows zgłasza Ctrl+Alt, więc to nie skrót
      if (ctrl) { e.preventDefault(); if (it?.ctrl) submit(e.key, true); return }
      if (e.key === ' ') e.preventDefault()
      submit(e.key, false)
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
  const screen = (k: string) => {   // klawiatura ekranowa (tablet): przełączniki Ctrl / Shift / AltGr
    let ch = k
    if (!mods.ctrl) { if (mods.altgr && POL[k]) ch = mods.shift ? POL[k].toUpperCase() : POL[k]; else if (mods.shift) ch = SH[k] ?? k.toUpperCase() }
    submit(ch, mods.ctrl); setMods({ shift: false, altgr: false, ctrl: false })
  }
  const tp = it ? (it.ctrl ? { key: it.text, shift: false, altgr: false } : plan(it.text[pos])) : null
  const modBtn = (k: 'ctrl' | 'shift' | 'altgr', label: string, need: boolean) => <button key={k} onClick={() => setMods({ ...mods, [k]: !mods[k] })}
    className={`h-10 rounded-lg px-3 font-bold sm:h-12 ${mods[k] ? 'bg-yellow-300 text-slate-900' : 'bg-slate-600'} ${need ? 'ring-4 ring-white' : ''}`}>{label}</button>

  return (
    <div className="mx-auto max-w-3xl p-4 pt-14 text-center">
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <RoboBit voice={!run && !fin ? 'kb_pick' : undefined} say={fin ? `Koniec lekcji! Błędy: ${errors}.` : run ? msg : 'Wybierz lekcję. Każda trwa tylko chwilę!'} />

      {!run && !fin && <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {MODES.map(m => <motion.button key={m.id} whileTap={{ scale: .96 }} onClick={() => start(m)} className="rounded-2xl bg-emerald-600 p-4 text-left shadow-lg">
          <div className="text-2xl font-extrabold">{m.icon} {m.label}</div><div className="text-slate-100">{m.info}</div>
          <div className="mt-1 text-sm text-yellow-200">{best(m.id) ? '⭐'.repeat(best(m.id)) : 'jeszcze nie ukończono'}</div></motion.button>)}
      </div>}

      {fin && <div className="mt-6 rounded-3xl bg-white/10 p-6">
        <div className="text-5xl">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        <div className="mt-2 text-2xl font-extrabold">{mode.label}: ukończone!</div>
        <div className="mt-1 text-lg">Błędy: {errors} · Czas: {secs} s</div>
        <div className="mt-4 flex justify-center gap-3"><button onClick={() => start(mode)} className="rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">Jeszcze raz</button>
          <button onClick={() => setFin(false)} className="rounded-full bg-white/20 px-6 py-3 text-xl">Inna lekcja</button></div></div>}

      {run && it && <>
        <div className="mt-4 flex justify-between text-lg font-bold"><span>{mode.icon} {idx + 1} / {items.length}</span><span>❌ {errors}</span><span>⏱️ {secs} s</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-yellow-300 transition-all" style={{ width: `${100 * idx / items.length}%` }} /></div>
        <motion.div key={bad} animate={bad ? { x: [-10, 10, -8, 8, 0] } : {}} className="mx-auto my-4 flex min-h-[7rem] w-fit min-w-[7rem] flex-col items-center justify-center rounded-3xl bg-yellow-300 px-6 py-3 font-extrabold text-slate-900 shadow-2xl">
          <div className={`${it.ctrl ? 'text-5xl' : 'text-7xl'} tracking-widest`}>{[...it.label].map((c, i) => <span key={i} className={!it.ctrl && i < pos ? 'text-emerald-600' : ''}>{c}</span>)}</div>
          {it.desc && <div className="mt-1 text-xl">{it.desc}</div>}</motion.div>
        <p className="mb-3 text-lg text-sky-200">{hintFor(it, pos)}</p>
        <div className="mb-2 flex justify-center gap-2">{modBtn('ctrl', 'Ctrl', !!it.ctrl)}{modBtn('shift', 'Shift', !!tp?.shift)}{modBtn('altgr', 'AltGr', !!tp?.altgr)}</div>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1">
          {ROWS.map((row, ri) => <div key={row} className="flex gap-1" style={{ marginLeft: ri * 12 }}>
            {[...row].map(k => <motion.button key={k} onClick={() => screen(k)} whileTap={{ scale: .9 }} animate={k === tp?.key ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}
              className={`h-9 w-8 rounded-lg text-base font-bold text-slate-900 sm:h-12 sm:w-11 sm:text-lg ${k === tp?.key ? 'ring-4 ring-white' : 'opacity-60'}`} style={{ background: FCOL[FING[k]] }}>{k.toUpperCase()}</motion.button>)}
          </div>)}
        </div>
        <p className="mt-3 text-sm text-slate-300">Kolor klawisza pokazuje palec. Na tablecie dotknij Ctrl, Shift lub AltGr, a potem klawisz.</p>
      </>}
    </div>
  )
}
