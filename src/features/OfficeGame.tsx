import { useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click } from '../audio'
import { playVoice } from '../voice'

interface W { bold: boolean; italic: boolean; color: string; size: number; align: 'left' | 'center' | 'right' }
interface Slide { title: string; text: string; pic: string }
const COLORS = ['#111827', '#ef4444', '#22c55e', '#3b82f6', '#a855f7']
const WT: [string, (w: W) => boolean][] = [['Pogrub tekst (przycisk B)', w => w.bold], ['Zmień kolor tekstu na czerwony', w => w.color === '#ef4444'], ['Powiększ tekst przyciskiem A+', w => w.size >= 32], ['Wyśrodkuj tekst', w => w.align === 'center']]
const PICS = ['🐶', '🚀', '🌳', '🖥️', '🌈', '⭐']
const ST: [string, (s: Slide[]) => boolean][] = [['Wpisz tytuł prezentacji na pierwszym slajdzie', s => s[0].title.trim().length > 2], ['Dodaj drugi slajd (przycisk ➕ Slajd)', s => s.length >= 2], ['Wstaw obrazek na drugim slajdzie', s => !!s[1]?.pic]]
const lead = <T,>(a: [string, (x: T) => boolean][], x: T) => { let n = 0; while (n < a.length && a[n][1](x)) n++; return n }

export default function OfficeGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [stage, setStage] = useState<'word' | 'slides' | 'end'>('word')
  const [w, setW] = useState<W>({ bold: false, italic: false, color: '#111827', size: 20, align: 'left' }), [text, setText] = useState('Mój ulubiony zwierzak to pies.')
  const [slides, setSlides] = useState<Slide[]>([{ title: '', text: '', pic: '' }]), [cur, setCur] = useState(0)
  const wd = lead(WT, w), sd = lead(ST, slides)
  const tb = (on: boolean) => `h-12 min-w-[3rem] rounded-xl px-3 text-xl font-bold shadow ${on ? 'bg-yellow-300 text-slate-900' : 'bg-slate-700'}`
  const upd = (p: Partial<Slide>) => setSlides(s => s.map((x, i) => (i === cur ? { ...x, ...p } : x)))
  const finish = () => { setStage('end'); onEnd(4); playVoice('office_done') }
  const tasks = (list: [string, unknown][], done: number) => <ul className="mt-3 space-y-1 rounded-2xl bg-white/10 p-3">{list.map(([t], k) => <li key={t} className={k < done ? 'text-emerald-300' : k === done ? 'font-bold' : 'text-slate-400'}>{k < done ? '✅' : k === done ? '👉' : '⬜'} {t}</li>)}</ul>
  return (
    <div className="mx-auto max-w-3xl p-4 pt-14">
      <button onClick={onBack} className="rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <div className="mt-3"><RoboBit say={stage === 'end' ? 'Brawo! Umiesz formatować tekst i robić prezentację!' : stage === 'word' ? 'Wykonaj zadania z listy, formatując tekst jak w programie Word.' : 'Zrobimy prezentację z dwóch slajdów!'} voice={stage === 'word' ? 'office_intro' : undefined} /></div>
      {stage === 'word' && <div className="mt-3">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-800 p-2">
          <button className={tb(w.bold)} onClick={() => { click(); setW({ ...w, bold: !w.bold }) }}><b>B</b></button>
          <button className={tb(w.italic)} onClick={() => { click(); setW({ ...w, italic: !w.italic }) }}><i>I</i></button>
          {COLORS.map(c => <button key={c} aria-label={c} onClick={() => { click(); setW({ ...w, color: c }) }} className={`h-12 w-12 rounded-xl border-4 ${w.color === c ? 'border-yellow-300' : 'border-white'}`} style={{ background: c }} />)}
          <button className={tb(false)} onClick={() => setW({ ...w, size: Math.max(14, w.size - 6) })}>A−</button><button className={tb(false)} onClick={() => setW({ ...w, size: Math.min(48, w.size + 6) })}>A+</button>
          {(['left', 'center', 'right'] as const).map(a => <button key={a} className={tb(w.align === a)} onClick={() => setW({ ...w, align: a })}>{a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}</button>)}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} aria-label="Dokument" className="mt-2 w-full rounded-2xl bg-white p-4"
          style={{ fontWeight: w.bold ? 800 : 400, fontStyle: w.italic ? 'italic' : 'normal', color: w.color, fontSize: w.size, textAlign: w.align }} />
        {tasks(WT, wd)}{wd === WT.length && <button onClick={() => setStage('slides')} className="mt-3 rounded-full bg-pink-500 px-8 py-3 text-xl font-bold">Dalej: prezentacja →</button>}</div>}
      {stage === 'slides' && <div className="mt-3">
        <div className="flex flex-wrap gap-2">{slides.map((_, i) => <button key={i} onClick={() => setCur(i)} className={`rounded-xl px-4 py-2 font-bold ${cur === i ? 'bg-yellow-300 text-slate-900' : 'bg-white/15'}`}>Slajd {i + 1}</button>)}
          {slides.length < 2 && <button onClick={() => { setSlides([...slides, { title: '', text: '', pic: '' }]); setCur(1) }} className="rounded-xl bg-emerald-500 px-4 py-2 font-bold">➕ Slajd</button>}</div>
        <motion.div key={cur} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 text-center text-slate-900">
          <div className="text-3xl font-extrabold">{slides[cur].title || 'Tytuł'}</div><div className="text-lg">{slides[cur].text}</div><div className="text-6xl">{slides[cur].pic}</div></motion.div>
        <input value={slides[cur].title} onChange={e => upd({ title: e.target.value })} placeholder="Tytuł slajdu" className="mt-2 w-full rounded-xl bg-white p-3 text-slate-900" />
        <input value={slides[cur].text} onChange={e => upd({ text: e.target.value })} placeholder="Krótki tekst" className="mt-2 w-full rounded-xl bg-white p-3 text-slate-900" />
        <div className="mt-2 flex flex-wrap gap-2">{PICS.map(p => <button key={p} onClick={() => upd({ pic: p })} className={`h-14 w-14 rounded-xl text-3xl ${slides[cur].pic === p ? 'bg-yellow-300' : 'bg-white/15'}`}>{p}</button>)}</div>
        {tasks(ST, sd)}{sd === ST.length && <button onClick={finish} className="mt-3 rounded-full bg-emerald-500 px-8 py-3 text-xl font-bold">Gotowe! ✔</button>}</div>}
      {stage === 'end' && <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">⭐⭐⭐⭐</div><div className="mt-2 text-2xl font-extrabold">Tekst i prezentacja gotowe!</div><button onClick={onBack} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div>}
    </div>
  )
}
