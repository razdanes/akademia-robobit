import { useState } from 'react'
import type { Progress } from '../store'
import { PAGES } from './pages'
const MODS: Record<string, string> = { coloring: 'Kolorowanki', paint: 'Paint Junior', pc: 'Budujemy komputer', keys: 'Klawiatura', db: 'Baza danych', code: 'Programuj robota', eco: 'Eko-Świat', math: 'Logiczny Detektyw', safe: 'Bezpieczny Internet', office: 'Word i prezentacje', safari: 'Słowne Safari', shop: 'Domek RoboBita' }
const DOMAINS: [string, string[]][] = [['💻 Informatyka', ['pc', 'keys', 'db', 'code', 'office']], ['🛡️ Bezpieczeństwo', ['safe']], ['🎨 Sztuka', ['coloring', 'paint']], ['🌍 Przyroda', ['eco']], ['➗ Matematyka', ['math']], ['🔤 Języki', ['safari']]]
const fmt = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor(s % 3600 / 60)} min` : `${Math.floor(s / 60)} min ${s % 60} s`)
const best = (id: string) => { try { return +(localStorage.getItem(`robobit-kb-best-${id}`) || 0) } catch { return 0 } }

export default function Dashboard({ p, onBack, onReset }: { p: Progress; onBack: () => void; onReset: () => void }) {
  const [a] = useState(() => 3 + Math.floor(Math.random() * 7)), [b] = useState(() => 3 + Math.floor(Math.random() * 7)), [v, setV] = useState(''), [ok, setOk] = useState(false), [name, setName] = useState('')
  if (!ok) return <div className="mx-auto max-w-sm p-4 pt-20 text-center"><div className="text-6xl">👨‍🏫</div><h2 className="mt-2 text-2xl font-extrabold">Panel rodzica i nauczyciela</h2>
    <p className="mt-2 text-slate-300">Zabezpieczenie przed dziećmi: ile to {a} × {b}?</p>
    <input value={v} onChange={e => setV(e.target.value)} inputMode="numeric" className="mt-3 w-full rounded-xl bg-white p-3 text-center text-2xl text-slate-900" />
    <div className="mt-3 flex justify-center gap-3"><button onClick={() => +v === a * b ? setOk(true) : setV('')} className="rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold">Wejdź</button><button onClick={onBack} className="rounded-full bg-white/20 px-6 py-3 text-lg">Wróć</button></div></div>
  const total = Object.values(p.seconds).reduce((x, y) => x + y, 0), max = Math.max(1, ...Object.values(p.seconds))
  return <div className="mx-auto max-w-4xl p-4 pt-14">
    <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
    <h2 className="text-3xl font-extrabold">📊 Statystyki ucznia</h2>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[['⏱️ Czas gry', fmt(total)], ['⭐ Gwiazdki', `${p.stars}`], ['🏅 Odznaki', `${p.badges.length}`], ['🎯 Zadania dnia', `${p.quests}`]].map(([n, x]) => <div key={n} className="rounded-2xl bg-white/10 p-3 text-center"><div className="text-sm text-slate-300">{n}</div><div className="text-2xl font-extrabold">{x}</div></div>)}
    </div>
    <h3 className="mt-5 text-xl font-bold">Czas i ukończone aktywności</h3>
    <div className="mt-2 space-y-2">{Object.entries(MODS).map(([id, n]) => <div key={id} className="rounded-xl bg-white/10 p-2">
      <div className="flex justify-between text-sm"><span>{n}</span><span>{fmt(p.seconds[id] || 0)} · ukończono: {p.completed[id] || 0}</span></div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-black/30"><div className="h-full bg-sky-400" style={{ width: `${100 * (p.seconds[id] || 0) / max}%` }} /></div></div>)}</div>
    <h3 className="mt-5 text-xl font-bold">Postępy w dziedzinach</h3>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">{DOMAINS.map(([n, ids]) => { const c = ids.reduce((x, i) => x + (p.completed[i] || 0), 0); return <div key={n} className="rounded-xl bg-white/10 p-3"><div className="font-bold">{n}</div>
      <div className="text-slate-300">{ids.length ? `Ukończone aktywności: ${c}` : 'Moduł w przygotowaniu'}</div></div> })}</div>
    <div className="mt-4 rounded-xl bg-white/10 p-3 text-slate-200">🎨 Pokolorowane obrazki: {p.done.length} z {PAGES.length} · ⌨️ Rekordy klawiatury: litery {best('letters')}, cyfry {best('digits')}, rząd domowy {best('home')}, słowa {best('words')}</div>
    <div className="mt-2 rounded-xl bg-white/10 p-3 text-slate-200">🏅 {p.badges.length ? p.badges.join(' · ') : 'Brak odznak'}</div>
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-3 print:hidden"><span>🏆 Dyplom do wydruku:</span>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Imię ucznia (nie jest zapisywane)" className="rounded-lg bg-white px-3 py-2 text-slate-900" />
      <button onClick={() => window.print()} className="rounded-full bg-amber-400 px-5 py-2 font-bold text-slate-900">🖨️ Drukuj</button></div>
    <div className="print-area hidden bg-white p-10 text-center text-slate-900 print:block"><div className="m-6 rounded-3xl border-8 border-double border-amber-500 p-10">
      <div className="text-6xl">🤖🏆</div><h1 className="mt-4 text-6xl font-extrabold text-indigo-700">DYPLOM</h1><p className="mt-6 text-2xl">Akademia RoboBit gratuluje</p>
      <p className="mt-4 text-5xl font-extrabold">{name || 'Wspaniałemu Uczniowi'}</p><p className="mt-6 text-2xl">za zdobycie <b>{p.stars} ⭐</b> i poziom <b>{Math.floor(p.stars / 10) + 1}</b></p>
      {p.badges.length > 0 && <p className="mt-4 text-xl">Odznaki: {p.badges.join(' · ')}</p>}<p className="mt-10 text-lg">{new Date().toLocaleDateString('pl-PL')} · RoboBit</p></div></div>
    <button onClick={() => confirm('Na pewno wyzerować cały postęp dziecka?') && onReset()} className="mt-5 rounded-full bg-red-600 px-5 py-2">Wyzeruj postęp</button>
  </div>
}
