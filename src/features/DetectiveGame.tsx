import { useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click } from '../audio'
import { playVoice } from '../voice'

const rn = (n: number) => Math.floor(Math.random() * n)
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - .5)
const uniq = <T,>(a: T[]) => [...new Set(a)]
interface Q { prompt: string; shown: string[]; options: string[]; answer: string; hint: string }

function seqQ(i: number): Q {
  let t: number[], hint: string
  if (i < 2) { const s = 1 + rn(3), a = 1 + rn(5); t = [0, 1, 2, 3, 4].map(k => a + k * s); hint = `Każda liczba jest większa o ${s}.` }
  else if (i < 4) { const s = [2, 5, 10][rn(3)], a = s * (1 + rn(3)), down = rn(2) === 0; t = [0, 1, 2, 3, 4].map(k => (down ? a + (4 - k) * s : a + k * s)); hint = down ? `Liczby maleją o ${s}.` : `Liczby rosną o ${s}.` }
  else if (i === 4) { const a = 1 + rn(3); t = [0, 1, 2, 3, 4].map(k => a * 2 ** k); hint = 'Każda liczba jest dwa razy większa od poprzedniej.' }
  else { t = [1, 2, 3, 4, 5].map(k => k * k); hint = 'To liczby 1×1, 2×2, 3×3…' }
  const ans = t[4], d = uniq([ans + 1, ans - 1, ans + 2, ans - 2, ans + 3].filter(x => x > 0 && x !== ans))
  return { prompt: 'Jaka liczba jest następna?', shown: t.slice(0, 4).map(String), options: shuffle([ans, ...shuffle(d).slice(0, 3)]).map(String), answer: String(ans), hint }
}
const SYMS = ['🔴', '🔵', '🟡', '🟢', '🟣', '🔺', '⭐', '🟧']
function patQ(): Q {
  const unit = ['AB', 'ABC', 'AAB', 'ABB'][rn(4)], sy = shuffle(SYMS), map: Record<string, string> = { A: sy[0], B: sy[1], C: sy[2] }
  const seq = [...unit.repeat(3)].map(c => map[c]), n = unit.length * 2 + unit.length - 1
  const used = uniq([...unit].map(c => map[c])), ans = seq[n]
  return { prompt: 'Co powinno być dalej?', shown: seq.slice(0, n), options: shuffle([...used, sy[4]]), answer: ans, hint: 'Poszukaj kawałka, który się powtarza.' }
}
const ODD = [['🍎', '🍌', '🍇', '🚗'], ['🐶', '🐱', '🐰', '🔨'], ['🚗', '🚌', '🚲', '🍕'], ['☀️', '🌙', '⭐', '🐟'], ['🔴', '🔵', '🟢', '🐄']]
const oddQ = (s: string[]): Q => ({ prompt: 'Która rzecz nie pasuje do pozostałych?', shown: [], options: shuffle(s), answer: s[3], hint: 'Szukaj rzeczy z innej grupy.' })

function Quiz({ questions, onDone, onExit }: { questions: Q[]; onDone: (s: number) => void; onExit: () => void }) {
  const [i, setI] = useState(0), [tries, setTries] = useState(0), [first, setFirst] = useState(0), [ok, setOk] = useState(false), [bad, setBad] = useState<string[]>([]), [msg, setMsg] = useState('Zbadaj zagadkę i wybierz odpowiedź!')
  const fin = i >= questions.length, stars = first >= 5 ? 3 : first >= 3 ? 2 : 1, q = questions[i]
  const pick = (o: string) => {
    if (ok || bad.includes(o)) return
    if (o === q.answer) { click(880); setOk(true); setMsg('Brawo, detektywie! Zagadka rozwiązana!'); if (!tries) setFirst(f => f + 1) }
    else { click(200); setTries(t => t + 1); setBad([...bad, o]); setMsg(`Nie to. Wskazówka: ${q.hint}`) }
  }
  const next = () => { const n = i + 1; setI(n); setOk(false); setBad([]); setTries(0); setMsg('Kolejna zagadka!'); if (n >= questions.length) { onDone(stars); playVoice('math_done') } }
  if (fin) return <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(stars)}</div><div className="mt-2 text-3xl font-extrabold">Za pierwszym razem: {first} z {questions.length}</div>
    <button onClick={onExit} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>
  return <div className="mt-3 text-center"><RoboBit say={msg} />
    <div className="mt-2 text-sm text-sky-300">Zagadka {i + 1} z {questions.length}</div><div className="mt-1 text-2xl font-bold">{q.prompt}</div>
    {q.shown.length > 0 && <div className="my-4 flex flex-wrap items-center justify-center gap-2">{q.shown.map((s, k) => <span key={k} className="flex h-16 min-w-[4rem] items-center justify-center rounded-2xl bg-white/15 px-3 text-4xl font-extrabold">{s}</span>)}<span className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-dashed border-yellow-300 text-4xl">{ok ? q.answer : '❓'}</span></div>}
    <div className="mt-4 flex flex-wrap justify-center gap-3">{q.options.map(o => <motion.button key={o} whileTap={{ scale: .9 }} onClick={() => pick(o)}
      className={`h-20 min-w-[5rem] rounded-2xl px-4 text-4xl font-extrabold shadow-lg ${ok && o === q.answer ? 'bg-emerald-500' : bad.includes(o) ? 'bg-red-500/70' : 'bg-sky-600'}`}>{o}</motion.button>)}</div>
    {ok && <button onClick={next} className="mt-5 rounded-full bg-pink-500 px-8 py-3 text-xl font-bold">Dalej →</button>}</div>
}

interface Op { l: string; f: (v: number) => number }
const O = (l: string, f: (v: number) => number): Op => ({ l, f })
const POOLS: Op[][] = [[O('+1', v => v + 1), O('+2', v => v + 2), O('+3', v => v + 3)], [O('+2', v => v + 2), O('+5', v => v + 5), O('−1', v => v - 1)], [O('×2', v => v * 2), O('+1', v => v + 1), O('+3', v => v + 3)], [O('×2', v => v * 2), O('+5', v => v + 5), O('−2', v => v - 2)], [O('×2', v => v * 2), O('+3', v => v + 3), O('−1', v => v - 1)]]
function genLevel(r: number) {
  const set = POOLS[Math.min(r, 4)], n = 2 + Math.min(2, Math.floor(r / 2))
  for (let t = 0; t < 200; t++) {
    const start = 1 + rn(6); let v = start, okv = true
    for (let k = 0; k < n; k++) { v = set[rn(3)].f(v); if (v < 0 || v > 40) okv = false }
    if (okv && v !== start && v > 0) return { start, target: v, set, max: n + 1 }
  }
  return { start: 2, target: 5, set: POOLS[0], max: 3 }
}
function Commands({ onDone, onExit }: { onDone: (s: number) => void; onExit: () => void }) {
  const [r, setR] = useState(0), [lv, setLv] = useState(() => genLevel(0)), [prog, setProg] = useState<Op[]>([]), [val, setVal] = useState(lv.start), [run, setRun] = useState(false), [won, setWon] = useState(false), [tries, setTries] = useState(0), [first, setFirst] = useState(0), [msg, setMsg] = useState('Ułóż rozkazy tak, żeby RoboBit stanął na fladze!'), [fin, setFin] = useState(false)
  const stars = first >= 4 ? 3 : first >= 2 ? 2 : 1
  const go = async () => {
    if (run || won || !prog.length) return
    setRun(true); let v = lv.start; setVal(v)
    for (const op of prog) { await new Promise(res => setTimeout(res, 650)); v = op.f(v); setVal(v); click(500 + v * 12) }
    await new Promise(res => setTimeout(res, 500))
    if (v === lv.target) { click(880); setWon(true); setMsg('Idealnie! RoboBit dotarł do flagi!'); if (!tries) setFirst(f => f + 1) }
    else { click(200); setTries(t => t + 1); setMsg(`RoboBit stanął na ${v}, a flaga jest na ${lv.target}. Zmień rozkazy i spróbuj jeszcze raz.`); setVal(lv.start) }
    setRun(false)
  }
  const nxt = () => { if (r >= 4) { setFin(true); onDone(first >= 4 ? 3 : first >= 2 ? 2 : 1); playVoice('math_done'); return } const l = genLevel(r + 1); setR(r + 1); setLv(l); setProg([]); setVal(l.start); setWon(false); setTries(0); setMsg('Nowy poziom! Ułóż rozkazy.') }
  if (fin) return <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(stars)}</div><div className="mt-2 text-3xl font-extrabold">Za pierwszym razem: {first} z 5</div>
    <button onClick={onExit} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>
  const pos = (n: number) => `${Math.max(0, Math.min(100, n / 40 * 100))}%`
  return <div className="mt-3 text-center"><RoboBit say={msg} />
    <div className="mt-2 text-sm text-sky-300">Poziom {r + 1} z 5 · start: {lv.start} · cel: {lv.target} · maks. {lv.max} rozkazy</div>
    <div className="relative mx-auto mt-6 h-16 max-w-xl rounded-full bg-white/10"><div className="absolute left-0 right-0 top-1/2 h-1 bg-white/30" />
      <div className="absolute -top-6 text-4xl" style={{ left: pos(lv.target), transform: 'translateX(-50%)' }}>🏁</div>
      <motion.div className="absolute top-1 text-5xl" animate={{ left: pos(val) }} style={{ translateX: '-50%' }} transition={{ type: 'spring', stiffness: 120 }}>🤖</motion.div></div>
    <div className="mt-3 text-5xl font-extrabold">{val}</div>
    <div className="mt-3 flex justify-center gap-3">{lv.set.map(o => <motion.button key={o.l} whileTap={{ scale: .9 }} onClick={() => !run && !won && prog.length < lv.max && (click(600), setProg([...prog, o]))} className="h-16 w-20 rounded-2xl bg-sky-600 text-3xl font-extrabold shadow-lg">{o.l}</motion.button>)}</div>
    <div className="mx-auto mt-3 flex min-h-[4rem] max-w-xl flex-wrap items-center justify-center gap-2 rounded-2xl bg-slate-900 p-2">
      {prog.length ? prog.map((o, k) => <button key={k} onClick={() => !run && !won && setProg(prog.filter((_, j) => j !== k))} className="rounded-xl bg-yellow-300 px-4 py-2 text-2xl font-bold text-slate-900">{o.l}</button>) : <span className="text-slate-400">Tu pojawią się rozkazy (dotknij, aby usunąć)</span>}</div>
    <div className="mt-3 flex justify-center gap-3"><button onClick={go} disabled={run || won} className="rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold disabled:opacity-50">▶ Uruchom</button>
      <button onClick={() => !run && (setProg([]), setVal(lv.start))} className="rounded-full bg-white/20 px-5 py-3 text-lg">↺ Wyczyść</button>
      {won && <button onClick={nxt} className="rounded-full bg-pink-500 px-6 py-3 text-xl font-bold">{r >= 4 ? 'Koniec ✔' : 'Dalej →'}</button>}</div></div>
}

export default function DetectiveGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [g, setG] = useState<'menu' | 'seq' | 'shape' | 'cmd'>('menu'), [qs, setQs] = useState<Q[]>([])
  const open = (m: 'seq' | 'shape' | 'cmd') => { if (m === 'seq') setQs([0, 1, 2, 3, 4, 5].map(seqQ)); if (m === 'shape') setQs([patQ(), patQ(), patQ(), patQ(), ...shuffle(ODD).slice(0, 2).map(oddQ)]); setG(m) }
  const C = [['seq', '🔢', 'Tajemnicze liczby', 'Jaka liczba będzie następna?', 'from-fuchsia-500 to-purple-600'], ['shape', '🔷', 'Figury i wzory', 'Co pasuje dalej? Co nie pasuje?', 'from-sky-500 to-indigo-600'], ['cmd', '🤖', 'Rozkazy dla RoboBita', 'Dodawaj, odejmuj i mnóż', 'from-emerald-500 to-teal-600']] as const
  return (
    <div className="mx-auto max-w-3xl p-4 pt-14">
      <button onClick={g === 'menu' ? onBack : () => setG('menu')} className="rounded-full bg-white/20 px-4 py-2 text-lg">← {g === 'menu' ? 'Menu' : 'Detektyw'}</button>
      {g === 'menu' && <div className="mt-4"><RoboBit say="Witaj, detektywie! Rozwiąż zagadki z liczbami i figurami." voice="math_intro" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">{C.map(([id, ic, n, d, col]) => <button key={id} onClick={() => open(id)} className={`rounded-3xl bg-gradient-to-br ${col} p-5 text-left shadow-xl`}><div className="text-6xl">{ic}</div><div className="text-xl font-extrabold">{n}</div><div className="text-sm">{d}</div></button>)}</div></div>}
      {(g === 'seq' || g === 'shape') && <Quiz questions={qs} onDone={onEnd} onExit={() => setG('menu')} />}
      {g === 'cmd' && <Commands onDone={onEnd} onExit={() => setG('menu')} />}
    </div>
  )
}
