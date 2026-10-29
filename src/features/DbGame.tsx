import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'

interface Rec { name: string; animal: string; age: string }
type Task = { kind: 'add'; rec: Rec } | { kind: 'find'; q: string; a: string }
const TASKS: Task[] = [
  { kind: 'add', rec: { name: 'Burek', animal: 'pies', age: '3' } },
  { kind: 'add', rec: { name: 'Mruczek', animal: 'kot', age: '2' } },
  { kind: 'add', rec: { name: 'Nemo', animal: 'rybka', age: '1' } },
  { kind: 'find', q: 'Ile lat ma Mruczek?', a: '2' },
  { kind: 'find', q: 'Jakim zwierzęciem jest Nemo?', a: 'rybka' },
  { kind: 'add', rec: { name: 'Kiki', animal: 'papuga', age: '5' } },
  { kind: 'find', q: 'Które zwierzę ma najwięcej lat? Wpisz imię.', a: 'kiki' },
]
const norm = (s: string) => s.trim().toLowerCase()
const digits = (s: string) => s.replace(/\D/g, '')
const empty = { name: '', animal: '', age: '' }
type Key = keyof Rec
const LABEL: Record<Key, string> = { name: 'Imię', animal: 'Zwierzę', age: 'Wiek (lata)' }
const KEYS: Key[] = ['name', 'animal', 'age']

export default function DbGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const [mode, setMode] = useState<'tasks' | 'free'>('tasks')
  const [t, setT] = useState(0), [rows, setRows] = useState<Rec[]>([]), [f, setF] = useState(empty), [ans, setAns] = useState('')
  const [wrong, setWrong] = useState<Partial<Record<Key, boolean>>>({}), [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null), [fin, setFin] = useState(false)
  const awarded = useRef(false)
  const task = TASKS[t]
  const ok = (text: string) => { click(880); setFb({ ok: true, text }); setWrong({}) }
  const err = (text: string) => { click(200); setFb({ ok: false, text }) }
  const switchMode = (m: 'tasks' | 'free') => { setMode(m); setRows([]); setF(empty); setAns(''); setFb(null); setWrong({}); setT(0); setFin(false) }
  const finish = () => { setFin(true); if (!awarded.current) { awarded.current = true; onEnd(4) } playVoice('db_done') }
  const edit = (k: Key, v: string) => { setF({ ...f, [k]: v }); setWrong({ ...wrong, [k]: false }) }

  const send = () => {
    if (mode === 'free') {
      if (!f.name.trim() || !f.animal.trim() || !digits(f.age)) { setWrong({ name: !f.name.trim(), animal: !f.animal.trim(), age: !digits(f.age) }); return err('Wypełnij wszystkie trzy pola. Wiek to liczba.') }
      const n = rows.length + 1
      setRows([...rows, { name: f.name.trim(), animal: f.animal.trim(), age: digits(f.age) }]); setF(empty); ok(`Dodano! W tabeli jest już ${n} ${n === 1 ? 'wiersz' : n < 5 ? 'wiersze' : 'wierszy'}.`)
      if (n === 3 && !awarded.current) { awarded.current = true; onEnd(3); playVoice('db_free_done') }
      return
    }
    if (task.kind === 'add') {
      const r = task.rec, good = { name: norm(f.name) === norm(r.name), animal: norm(f.animal) === norm(r.animal), age: digits(f.age) === r.age }
      if (!(good.name && good.animal && good.age)) { setWrong({ name: !good.name, animal: !good.animal, age: !good.age }); return err('Ups! Popraw pola zaznaczone na czerwono.') }
      setRows([...rows, r]); setF(empty); ok(`Dodano rekord: ${r.name}. Zobacz, nowy wiersz jest w tabeli!`)
    } else {
      if (norm(ans) !== norm(task.a)) return err('Spójrz jeszcze raz na tabelę. Odpowiedź jest w jednym z wierszy.')
      setAns(''); ok('Dobrze! Znalazłeś właściwą informację w bazie.')
    }
    if (t < TASKS.length - 1) setT(t + 1); else finish()
  }
  const inp = (k: Key) => `w-full rounded-lg bg-white px-2 py-2 text-lg text-slate-900 ${wrong[k] ? 'ring-4 ring-red-500' : ''}`
  const showForm = mode === 'free' || (!fin && task.kind === 'add')
  const instr = mode === 'free' ? 'Wpisz własne zwierzę i kliknij „Dodaj”. Zrób co najmniej 3 wiersze!' : task.kind === 'add' ? `Wpisz w pola: ${task.rec.name} | ${task.rec.animal} | ${task.rec.age}` : task.q

  return (
    <div className="mx-auto max-w-3xl p-4">
      {fin && <Confetti />}
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <RoboBit voice={fb ? undefined : fin ? 'db_done' : 'db_intro'} say={fb?.text || (fin ? 'Brawo! Znasz już podstawy baz danych!' : 'Baza danych to tabela. Wiersz to jeden zapis, a kolumny to jego pola.')} />
      <div className="mt-3 flex gap-2">
        {(['tasks', 'free'] as const).map(m => <button key={m} onClick={() => switchMode(m)} className={`rounded-full px-4 py-2 font-bold ${mode === m ? 'bg-yellow-300 text-slate-900' : 'bg-white/15'}`}>{m === 'tasks' ? '🎯 Zadania' : '✏️ Moja baza'}</button>)}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white/10 p-3">
        <table className="w-full text-left text-xl">
          <thead><tr className="text-sky-300">{KEYS.map(k => <th key={k} className="p-2">{LABEL[k]}</th>)}{mode === 'free' && <th />}</tr></thead>
          <tbody>
            {rows.map((r, i) => <motion.tr key={i} initial={{ opacity: 0, backgroundColor: '#22c55e' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 1 }} className="border-t border-white/20">
              {KEYS.map(k => <td key={k} className="p-2">{r[k]}</td>)}
              {mode === 'free' && <td><button aria-label="usuń" onClick={() => setRows(rows.filter((_, j) => j !== i))}>🗑️</button></td>}</motion.tr>)}
            {rows.length === 0 && <tr><td colSpan={4} className="p-3 text-slate-300">Tabela jest pusta. Wpisz dane poniżej – pojawią się tutaj jako nowy wiersz.</td></tr>}
            {showForm && <tr className="border-t-2 border-sky-400">
              {KEYS.map(k => <td key={k} className="p-1"><input className={inp(k)} placeholder={LABEL[k]} value={f[k]} onChange={e => edit(k, e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} inputMode={k === 'age' ? 'numeric' : 'text'} aria-label={LABEL[k]} /></td>)}
              {mode === 'free' && <td />}</tr>}
          </tbody>
        </table>
      </div>
      {!(fin && mode === 'tasks') && <div className="mt-4 rounded-2xl bg-sky-600 p-4">
        {mode === 'tasks' && <div className="text-sm text-sky-200">Zadanie {t + 1} z {TASKS.length}</div>}
        <div className="text-xl font-bold">{instr}</div>
        {mode === 'tasks' && task.kind === 'find' && <input className="mt-3 w-full rounded-lg bg-white px-2 py-2 text-lg text-slate-900" value={ans} onChange={e => setAns(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Twoja odpowiedź" />}
        <button onClick={send} className="mt-3 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">{showForm ? '➕ Dodaj do tabeli' : '✔ Sprawdź'}</button>
        {fb && <div className={`mt-3 rounded-xl px-3 py-2 text-lg font-bold ${fb.ok ? 'bg-emerald-700' : 'bg-red-600'}`}>{fb.ok ? '✅' : '❌'} {fb.text}</div>}
      </div>}
      {fin && mode === 'tasks' && <button onClick={() => switchMode('free')} className="mt-4 rounded-full bg-pink-500 px-6 py-3 text-xl font-bold">Zrób własną bazę →</button>}
    </div>
  )
}
