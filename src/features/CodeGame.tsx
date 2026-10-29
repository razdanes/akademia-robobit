import { useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'

type Dir = 'up' | 'down' | 'left' | 'right'
type Pt = [number, number]
const D: Record<Dir, { d: Pt; icon: string; word: string }> = {
  up: { d: [0, -1], icon: '⬆️', word: 'gora' }, down: { d: [0, 1], icon: '⬇️', word: 'dol' },
  left: { d: [-1, 0], icon: '⬅️', word: 'lewo' }, right: { d: [1, 0], icon: '➡️', word: 'prawo' },
}
interface Lvl { start: Pt; goal: Pt; walls: Pt[]; tip: string }
const N = 5
const LV: Lvl[] = [
  { start: [0, 0], goal: [3, 0], walls: [], tip: 'Dotknij strzałki, żeby dodać krok. Dotknij kroku, żeby go powtórzyć (×2, ×3…).' },
  { start: [0, 0], goal: [2, 3], walls: [], tip: 'Połącz kroki: kilka w prawo i kilka w dół.' },
  { start: [0, 2], goal: [4, 2], walls: [[2, 2]], tip: 'Mur blokuje drogę. Obejdź go górą albo dołem.' },
  { start: [0, 0], goal: [4, 4], walls: [[1, 0], [1, 1], [3, 3], [3, 4]], tip: 'Zaplanuj całą trasę, zanim naciśniesz Start.' },
  { start: [0, 4], goal: [4, 0], walls: [[1, 4], [1, 3], [1, 2], [3, 0], [3, 1], [3, 2]], tip: 'Ostatni poziom: trasa zygzakiem!' },
]
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function CodeGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [l, setL] = useState(0), [prog, setProg] = useState<{ d: Dir; n: number }[]>([]), [pos, setPos] = useState<Pt>(LV[0].start)
  const [run, setRun] = useState(false), [won, setWon] = useState(false), [got, setGot] = useState(false), [fin, setFin] = useState(false), [msg, setMsg] = useState(LV[0].tip)
  const lv = LV[l]
  const add = (d: Dir) => { if (!run && !won) { click(600); setProg([...prog, { d, n: 1 }]) } }
  const bump = (i: number) => !run && setProg(p => p.map((s, j) => (j === i ? { ...s, n: (s.n % 5) + 1 } : s)))
  const del = (i: number) => !run && setProg(p => p.filter((_, j) => j !== i))
  const win = () => {
    click(880); setGot(true); setWon(true)
    if (l === LV.length - 1) { setFin(true); onEnd(6); setMsg('Jesteś programistą! Wszystkie poziomy ukończone!'); playVoice('code_fin') }
    else { setMsg('Brawo! Bateria zebrana. Program działa!'); playVoice('code_win') }
  }
  const play = async () => {
    if (run || won || !prog.length) return
    setRun(true); setGot(false); let [x, y] = lv.start; setPos([x, y]); await wait(300)
    for (const s of prog) for (let k = 0; k < s.n; k++) {
      const nx = x + D[s.d].d[0], ny = y + D[s.d].d[1]
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || lv.walls.some(w => w[0] === nx && w[1] === ny)) { click(200); setMsg('Au! Robot uderzył w przeszkodę. Popraw program.'); setRun(false); return }
      x = nx; y = ny; setPos([x, y]); click(500 + 60 * k); await wait(450)
      if (x === lv.goal[0] && y === lv.goal[1]) { win(); setRun(false); return }
    }
    setMsg('Robot nie dojechał do baterii. Popraw program i spróbuj jeszcze raz.')
    setRun(false)
  }
  const next = () => { setL(l + 1); setProg([]); setPos(LV[l + 1].start); setWon(false); setGot(false); setMsg(LV[l + 1].tip) }
  const retry = () => { if (run) return; setPos(lv.start); setGot(false); setWon(false); setMsg(lv.tip) }
  return (
    <div className="mx-auto max-w-4xl p-4">
      {fin && <Confetti />}
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <RoboBit say={msg} voice={msg === lv.tip ? `code_tip_${l + 1}` : undefined} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-sm text-sky-300">Poziom {l + 1} z {LV.length}</div>
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-800">
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
              {Array.from({ length: N * N }, (_, i) => {
                const x = i % N, y = Math.floor(i / N), wall = lv.walls.some(w => w[0] === x && w[1] === y), goal = lv.goal[0] === x && lv.goal[1] === y
                return <div key={i} className="flex items-center justify-center border border-white/10 text-3xl">{wall ? '🧱' : goal ? (got ? '✨' : '🔋') : ''}</div>
              })}
            </div>
            <motion.div className="absolute flex items-center justify-center text-4xl" style={{ width: '20%', height: '20%' }}
              animate={{ left: `${pos[0] * 20}%`, top: `${pos[1] * 20}%` }} transition={{ duration: .3 }}>🤖</motion.div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {(Object.keys(D) as Dir[]).map(d => <button key={d} onClick={() => add(d)} className="h-14 w-14 rounded-2xl bg-sky-500 text-2xl shadow-lg">{D[d].icon}</button>)}
          </div>
          <div className="min-h-[7rem] rounded-xl bg-slate-900 p-2">
            <div className="flex flex-wrap gap-2">
              {prog.map((s, i) => <span key={i} className="flex items-center rounded-xl bg-yellow-300 text-slate-900">
                <button onClick={() => bump(i)} className="px-3 py-2 text-xl font-bold">{D[s.d].icon}{s.n > 1 && `×${s.n}`}</button>
                <button onClick={() => del(i)} className="pr-2 text-sm" aria-label="usuń">✕</button></span>)}
              {!prog.length && <span className="text-slate-400">Tu ułóż program dla robota.</span>}
            </div>
          </div>
          <pre className="mt-2 max-h-32 overflow-auto rounded-xl bg-black/50 p-2 text-sm text-emerald-300">{prog.length ? prog.map(s => `robot.idz("${D[s.d].word}", ${s.n})`).join('\n') : '// kod pojawi się tutaj'}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={play} disabled={run || won} className="rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold disabled:opacity-50">▶ Start</button>
            <button onClick={retry} className="rounded-full bg-white/20 px-4 py-3 text-lg">↺ Od nowa</button>
            {won && !fin && <button onClick={next} className="rounded-full bg-pink-500 px-6 py-3 text-xl font-bold">Dalej →</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
