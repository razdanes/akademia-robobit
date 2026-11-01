import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click } from '../audio'
import { playVoice } from '../voice'

const VOC = [['🐱', 'kot', 'cat'], ['🐶', 'pies', 'dog'], ['🏠', 'dom', 'house'], ['🐟', 'ryba', 'fish'], ['☀️', 'słońce', 'sun'], ['🚀', 'rakieta', 'rocket'], ['⭐', 'gwiazda', 'star'],
  ['📖', 'książka', 'book'], ['🌳', 'drzewo', 'tree'], ['🌙', 'księżyc', 'moon'], ['🍎', 'jabłko', 'apple'], ['🚗', 'samochód', 'car']]
type Lang = 'pl' | 'en'
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - .5)
const word = (v: string[], l: Lang) => (l === 'pl' ? v[1] : v[2])
const Space = ({ children }: { children: React.ReactNode }) => <div className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-slate-950 to-black p-4">
  {Array.from({ length: 20 }, (_, i) => <motion.span key={i} className="absolute text-xs text-white" style={{ left: `${(i * 41) % 100}%`, top: `${(i * 29) % 100}%` }} animate={{ opacity: [.2, 1, .2] }} transition={{ repeat: Infinity, duration: 2 + i % 3, delay: i * .2 }}>✦</motion.span>)}
  <motion.div className="absolute right-3 top-3 text-5xl opacity-70" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5 }}>🪐</motion.div><div className="relative">{children}</div></div>

function Memory({ lang, onDone, onExit }: { lang: Lang; onDone: (s: number) => void; onExit: () => void }) {
  const pairs = 6
  const cards = useMemo(() => { const w = shuffle(VOC).slice(0, pairs); return shuffle(w.flatMap((v, k) => [{ id: `p${k}`, k, t: v[0], pic: true }, { id: `w${k}`, k, t: word(v, lang), pic: false }])) }, [lang])
  const [open, setOpen] = useState<string[]>([]), [match, setMatch] = useState<number[]>([]), [moves, setMoves] = useState(0), [lock, setLock] = useState(false)
  const fin = match.length === pairs, stars = moves <= pairs + 3 ? 3 : moves <= pairs * 2 ? 2 : 1, sent = useRef(false)
  useEffect(() => { if (fin && !sent.current) { sent.current = true; onDone(stars); playVoice('safari_done') } }, [fin])
  const flip = (id: string) => {
    if (lock || open.includes(id) || match.includes(cards.find(c => c.id === id)!.k)) return
    click(600); const o = [...open, id]; setOpen(o)
    if (o.length === 2) {
      setMoves(m => m + 1); const [a, b] = o.map(i => cards.find(c => c.id === i)!); setLock(true)
      setTimeout(() => { if (a.k === b.k && a.pic !== b.pic) { click(880); setMatch(m => [...m, a.k]) } else click(200); setOpen([]); setLock(false) }, 900)
    }
  }
  return <Space><RoboBit say={fin ? 'Świetnie! Znasz już nowe słowa!' : 'Połącz obrazek z jego nazwą!'} />
    <div className="my-2 flex justify-between font-bold"><span>Ruchy: {moves}</span><span>Pary: {match.length}/{pairs}</span></div>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{cards.map(c => { const shown = open.includes(c.id) || match.includes(c.k)
      return <motion.button key={c.id} whileTap={{ scale: .92 }} onClick={() => flip(c.id)} animate={shown ? { rotateY: [90, 0] } : { rotateY: 0 }}
        className={`flex h-24 items-center justify-center rounded-2xl text-center font-extrabold shadow-lg ${shown ? (match.includes(c.k) ? 'bg-emerald-600' : 'bg-white text-slate-900') : 'bg-gradient-to-br from-violet-600 to-fuchsia-700'} ${c.pic ? 'text-5xl' : 'text-2xl'}`}>{shown ? c.t : '✦'}</motion.button> })}</div>
    {fin && <div className="mt-4 text-center"><Confetti /><div className="text-4xl">{'⭐'.repeat(stars)}</div><button onClick={onExit} className="mt-2 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>}</Space>
}

function Scramble({ lang, onDone, onExit }: { lang: Lang; onDone: (s: number) => void; onExit: () => void }) {
  const words = useMemo(() => shuffle(VOC).slice(0, 6).sort((a, b) => word(a, lang).length - word(b, lang).length), [lang])
  const [i, setI] = useState(0), [pos, setPos] = useState(0), [used, setUsed] = useState<number[]>([]), [hints, setHints] = useState(0), [shake, setShake] = useState(0), [msg, setMsg] = useState('Dotykaj liter po kolei, żeby ułożyć słowo!')
  const w = words[i], target = i < words.length ? [...word(w, lang).toUpperCase()] : []
  const tiles = useMemo(() => { const l = [...target].map((ch, id) => ({ ch, id })); let s = shuffle(l); if (l.length > 1) while (s.every((t, k) => t.id === k)) s = shuffle(l); return s }, [i, lang])
  const done = i < words.length && pos === target.length, fin = i >= words.length, stars = hints <= 1 ? 3 : hints <= 3 ? 2 : 1, sent = useRef(false)
  useEffect(() => { if (fin && !sent.current) { sent.current = true; onDone(stars); playVoice('safari_done') } }, [fin])
  const put = (t: { ch: string; id: number }) => { if (done || used.includes(t.id)) return
    if (t.ch === target[pos]) { click(700 + pos * 60); setUsed([...used, t.id]); setPos(pos + 1); if (pos + 1 === target.length) setMsg('Brawo! Słowo gotowe!') } else { click(200); setShake(s => s + 1); setMsg('To nie ta litera. Spróbuj inną!') } }
  const hint = () => { if (done) return; const t = tiles.find(x => x.ch === target[pos] && !used.includes(x.id)); if (t) { setHints(h => h + 1); put(t) } }
  const next = () => { setI(i + 1); setPos(0); setUsed([]); setMsg('Kolejne słowo!') }
  if (fin) return <Space><div className="text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(stars)}</div><div className="mt-2 text-2xl font-extrabold">Ułożono 6 słów!</div><button onClick={onExit} className="mt-3 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div></Space>
  return <Space><RoboBit say={msg} /><div className="mt-2 text-center text-sm text-sky-300">Słowo {i + 1} z {words.length}</div>
    <div className="text-center text-8xl">{w[0]}</div>
    <motion.div key={shake} animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}} className="my-3 flex justify-center gap-2">{target.map((c, k) => <span key={k} className={`flex h-14 w-12 items-center justify-center rounded-xl border-4 text-3xl font-extrabold ${k < pos ? 'border-emerald-400 bg-emerald-600' : 'border-dashed border-yellow-300'}`}>{k < pos ? c : ''}</span>)}</motion.div>
    <div className="flex flex-wrap justify-center gap-2">{tiles.map(t => <motion.button key={t.id} whileTap={{ scale: .85 }} onClick={() => put(t)} className={`flex h-16 w-14 items-center justify-center rounded-2xl text-3xl font-extrabold shadow-lg ${used.includes(t.id) ? 'bg-white/10 text-white/20' : 'bg-gradient-to-br from-sky-500 to-violet-600'}`}>{t.ch}</motion.button>)}</div>
    <div className="mt-4 flex justify-center gap-3"><button onClick={hint} className="rounded-full bg-white/20 px-5 py-3 text-lg">💡 Podpowiedź</button>{done && <button onClick={next} className="rounded-full bg-pink-500 px-6 py-3 text-xl font-bold">Dalej →</button>}</div></Space>
}

export default function SafariGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [g, setG] = useState<'menu' | 'mem' | 'scr'>('menu'), [lang, setLang] = useState<Lang>('pl'), [k, setK] = useState(0)
  const open = (m: 'mem' | 'scr') => { setK(x => x + 1); setG(m) }
  return (
    <div className="mx-auto max-w-3xl p-4 pt-14">
      <button onClick={g === 'menu' ? onBack : () => setG('menu')} className="rounded-full bg-white/20 px-4 py-2 text-lg">← {g === 'menu' ? 'Menu' : 'Safari'}</button>
      {g === 'menu' && <div className="mt-4"><RoboBit say="Witaj w kosmicznym safari! Poznajemy nowe słowa." voice="safari_intro" />
        <div className="mt-3 flex gap-2">{(['pl', 'en'] as Lang[]).map(l => <button key={l} onClick={() => setLang(l)} className={`rounded-full px-5 py-2 text-lg font-bold ${lang === l ? 'bg-yellow-300 text-slate-900' : 'bg-white/15'}`}>{l === 'pl' ? '🇵🇱 Polski' : '🇬🇧 English'}</button>)}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button onClick={() => open('mem')} className="rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 text-left shadow-xl"><div className="text-6xl">🃏</div><div className="text-2xl font-extrabold">Memory słowne</div><div>Połącz obrazek z nazwą</div></button>
          <button onClick={() => open('scr')} className="rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 p-6 text-left shadow-xl"><div className="text-6xl">🔤</div><div className="text-2xl font-extrabold">Rozsypane litery</div><div>Ułóż słowo z liter</div></button></div></div>}
      {g === 'mem' && <Memory key={k} lang={lang} onDone={onEnd} onExit={() => setG('menu')} />}
      {g === 'scr' && <Scramble key={k} lang={lang} onDone={onEnd} onExit={() => setG('menu')} />}
    </div>
  )
}
