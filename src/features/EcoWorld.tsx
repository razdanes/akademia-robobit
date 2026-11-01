import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click } from '../audio'
import { playVoice } from '../voice'

const BINS = [{ id: 'paper', name: 'Papier', c: 'bg-blue-500' }, { id: 'plastic', name: 'Plastik i metal', c: 'bg-yellow-400 text-slate-900' }, { id: 'glass', name: 'Szkło', c: 'bg-green-500' }, { id: 'bio', name: 'Bio', c: 'bg-amber-800' }]
const WASTE = [['📰', 'paper', 'gazeta'], ['📦', 'paper', 'karton'], ['✉️', 'paper', 'koperta'], ['🧴', 'plastic', 'plastikowa butelka'], ['🥫', 'plastic', 'puszka'], ['🛍️', 'plastic', 'plastikowa torba'],
  ['🥤', 'plastic', 'plastikowy kubek'], ['🍾', 'glass', 'szklana butelka'], ['🍷', 'glass', 'szklany kieliszek'], ['🍌', 'bio', 'skórka od banana'], ['🍎', 'bio', 'ogryzek'], ['🥚', 'bio', 'skorupki jajek']]
const HABS = [['forest', '🌲', 'Las'], ['water', '🌊', 'Woda'], ['desert', '🏜️', 'Pustynia'], ['ice', '❄️', 'Lód'], ['meadow', '🌾', 'Łąka']]
const ANIMALS = [['🐻', 'forest', 'Niedźwiedź mieszka w lesie i zimą śpi.'], ['🦊', 'forest', 'Lis mieszka w lesie i ma w norze swój dom.'], ['🐟', 'water', 'Ryba oddycha pod wodą skrzelami.'], ['🐬', 'water', 'Delfin żyje w morzu, ale oddycha powietrzem.'],
  ['🐪', 'desert', 'Wielbłąd długo wytrzyma bez wody, więc mieszka na pustyni.'], ['🦂', 'desert', 'Skorpion chowa się przed upałem na pustyni.'], ['🐧', 'ice', 'Pingwin żyje na lodzie i świetnie pływa.'], ['🦭', 'ice', 'Foka mieszka na lodzie i w zimnym morzu.'],
  ['🐄', 'meadow', 'Krowa pasie się na łące i daje mleko.'], ['🐑', 'meadow', 'Owca pasie się na łące i ma ciepłą wełnę.']]
const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const TIME = 45

function Sort({ onEnd, onExit }: { onEnd: (s: number) => void; onExit: () => void }) {
  const [it, setIt] = useState(rnd(WASTE)), [k, setK] = useState(0), [score, setScore] = useState(0), [combo, setCombo] = useState(0), [left, setLeft] = useState(TIME), [msg, setMsg] = useState('Dotknij właściwego pojemnika, zanim śmieć spadnie!'), [fin, setFin] = useState(false)
  const done = useRef(false)
  const next = () => { setIt(rnd(WASTE)); setK(x => x + 1) }
  useEffect(() => { if (fin) return; const t = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(t) }, [fin])
  useEffect(() => { if (left <= 0 && !done.current) { done.current = true; setFin(true); onEnd(score >= 15 ? 3 : score >= 8 ? 2 : 1) } }, [left])
  const pick = (id: string) => {
    if (fin) return
    if (id === it[1]) { click(880); setScore(s => s + 1); setCombo(c => c + 1); setMsg(combo >= 3 ? `Seria ${combo + 1}! Świetnie!` : 'Dobrze!') }
    else { click(200); setCombo(0); setMsg(`Ups! ${it[2]} wyrzucamy do: ${BINS.find(b => b.id === it[1])!.name}.`) }
    next()
  }
  const miss = () => { if (!fin) { click(200); setCombo(0); setMsg('Za późno! Spróbuj szybciej.'); next() } }
  if (fin) return <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(score >= 15 ? 3 : score >= 8 ? 2 : 1)}</div>
    <div className="mt-2 text-3xl font-extrabold">Posegregowano: {score}</div><button onClick={onExit} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>
  return <div className="mt-3">
    <RoboBit say={msg} />
    <div className="mt-2 flex justify-between text-xl font-bold"><span>♻️ {score}</span><span>🔥 {combo}</span><span>⏱️ {left}s</span></div>
    <div className="relative mt-2 h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300/30 to-emerald-700/30">
      <motion.div key={k} className="absolute left-1/2 -ml-8 text-6xl" initial={{ y: 0 }} animate={{ y: 220 }} transition={{ duration: Math.max(3.5, 7 - score * .15), ease: 'linear' }} onAnimationComplete={miss}>{it[0]}</motion.div>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BINS.map(b => <motion.button key={b.id} whileTap={{ scale: .9 }} onClick={() => pick(b.id)} className={`rounded-2xl py-5 text-xl font-extrabold shadow-lg ${b.c}`}>🗑️<br />{b.name}</motion.button>)}
    </div>
  </div>
}

function Habitat({ onEnd, onExit }: { onEnd: (s: number) => void; onExit: () => void }) {
  const [round] = useState(() => [...ANIMALS].sort(() => Math.random() - .5).slice(0, 8)), [i, setI] = useState(0), [good, setGood] = useState(0), [fact, setFact] = useState(''), [ans, setAns] = useState<string | null>(null)
  const a = round[i], fin = i >= round.length
  const stars = good >= 7 ? 3 : good >= 5 ? 2 : 1
  useEffect(() => { if (fin) onEnd(stars) }, [fin])
  const pick = (id: string) => { if (ans) return; const ok = id === a[1]; click(ok ? 880 : 200); setAns(id); setFact(`${ok ? 'Dobrze! ' : 'Nie tym razem. '}${a[2]}`); if (ok) setGood(g => g + 1) }
  const nxt = () => { setAns(null); setFact(''); setI(i + 1) }
  if (fin) return <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(stars)}</div>
    <div className="mt-2 text-3xl font-extrabold">Dobrze: {good} z {round.length}</div><button onClick={onExit} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>
  return <div className="mt-3 text-center">
    <RoboBit say={fact || 'Gdzie mieszka to zwierzę? Wybierz jego środowisko.'} />
    <div className="mt-2 text-sm text-sky-300">Pytanie {i + 1} z {round.length}</div>
    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="my-4 text-9xl">{a[0]}</motion.div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {HABS.map(([id, ic, n]) => <motion.button key={id} whileTap={{ scale: .92 }} onClick={() => pick(id)}
        className={`rounded-2xl py-4 text-lg font-bold shadow-lg ${ans ? (id === a[1] ? 'bg-emerald-600' : id === ans ? 'bg-red-500' : 'bg-white/10') : 'bg-sky-600'}`}><div className="text-4xl">{ic}</div>{n}</motion.button>)}
    </div>
    {ans && <button onClick={nxt} className="mt-4 rounded-full bg-pink-500 px-8 py-3 text-xl font-bold">Dalej →</button>}
  </div>
}

export default function EcoWorld({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [g, setG] = useState<'menu' | 'sort' | 'hab'>('menu')
  useEffect(() => { if (g === 'menu') playVoice('eco_intro') }, [])
  return (
    <div className="mx-auto max-w-3xl p-4 pt-14">
      <button onClick={g === 'menu' ? onBack : () => setG('menu')} className="rounded-full bg-white/20 px-4 py-2 text-lg">← {g === 'menu' ? 'Menu' : 'Eko-Świat'}</button>
      {g === 'menu' && <div className="mt-4"><RoboBit say="Pomóż mi posprzątać świat i poznać zwierzęta!" voice="eco_intro" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button onClick={() => setG('sort')} className="rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-500 p-6 text-left shadow-xl"><div className="text-6xl">♻️</div><div className="text-2xl font-extrabold">Segregacja śmieci</div><div>Na czas, do 4 pojemników</div></button>
          <button onClick={() => setG('hab')} className="rounded-3xl bg-gradient-to-br from-sky-500 to-teal-500 p-6 text-left shadow-xl"><div className="text-6xl">🐻</div><div className="text-2xl font-extrabold">Gdzie to mieszka?</div><div>Dopasuj zwierzęta do środowiska</div></button>
        </div></div>}
      {g === 'sort' && <Sort onEnd={s => { onEnd(s); playVoice('eco_done') }} onExit={() => setG('menu')} />}
      {g === 'hab' && <Habitat onEnd={s => { onEnd(s); playVoice('eco_done') }} onExit={() => setG('menu')} />}
    </div>
  )
}
