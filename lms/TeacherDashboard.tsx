'use client'
// Panel nauczyciela – Next.js (App Router) + Tailwind + Recharts + SWR.  npm i recharts swr
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StudentRow { id: string; nickname: string; minutes: number; completed: number; total: number; errorRate: number; lastActive: string; level: number }
interface ClassStats { students: StudentRow[]; byModule: { module: string; minutes: number; completed: number }[]; weekly: { day: string; minutes: number }[] }
const MODULES = [['pc', 'Budujemy komputer'], ['keys', 'Poznaj klawiaturę'], ['db', 'Baza danych'], ['code', 'Programuj robota'], ['safe', 'Bezpieczny Internet'], ['word', 'Word i prezentacje']]
const RANGES = [[7, '7 dni'], [30, '30 dni'], [90, 'Semestr']] as const
const ERROR_ALERT = 0.35 // powyżej tego wskaźnika uczeń jest oznaczany jako „potrzebuje wsparcia”

const DEMO: ClassStats = {
  students: [
    { id: '1', nickname: 'Zwinny Lis', minutes: 142, completed: 5, total: 6, errorRate: .12, lastActive: 'dziś', level: 6 },
    { id: '2', nickname: 'Dzielny Smok', minutes: 96, completed: 4, total: 6, errorRate: .21, lastActive: 'wczoraj', level: 4 },
    { id: '3', nickname: 'Cichy Kot', minutes: 58, completed: 2, total: 6, errorRate: .41, lastActive: '3 dni temu', level: 2 },
    { id: '4', nickname: 'Wesoły Pingwin', minutes: 121, completed: 5, total: 6, errorRate: .09, lastActive: 'dziś', level: 5 },
  ],
  byModule: [{ module: 'Komputer', minutes: 120, completed: 4 }, { module: 'Klawiatura', minutes: 180, completed: 3 }, { module: 'Baza danych', minutes: 70, completed: 2 }, { module: 'Robot', minutes: 90, completed: 3 }],
  weekly: ['Pn', 'Wt', 'Śr', 'Czw', 'Pt'].map((day, i) => ({ day, minutes: [40, 85, 60, 110, 75][i] })),
}
const fetcher = (u: string) => fetch(u).then(r => { if (!r.ok) throw new Error('Błąd pobierania danych'); return r.json() })

export default function TeacherDashboard({ classes }: { classes: { id: string; name: string }[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [range, setRange] = useState<number>(30)
  const [hw, setHw] = useState({ moduleId: 'pc', dueAt: '' })
  const [msg, setMsg] = useState('')
  const { data, error, isLoading } = useSWR<ClassStats>(classId ? `/api/classes/${classId}/stats?range=${range}` : null, fetcher)
  const stats = data ?? (error ? DEMO : undefined) // DEMO tylko na czas developmentu
  const kpi = useMemo(() => {
    const s = stats?.students ?? []
    return [
      ['Średni czas pracy', s.length ? `${Math.round(s.reduce((a, x) => a + x.minutes, 0) / s.length)} min` : '–'],
      ['Ukończone moduły', `${s.reduce((a, x) => a + x.completed, 0)}`],
      ['Średni wskaźnik błędów', s.length ? `${Math.round(100 * s.reduce((a, x) => a + x.errorRate, 0) / s.length)}%` : '–'],
      ['Wymaga wsparcia', `${s.filter(x => x.errorRate > ERROR_ALERT).length} uczn.`],
    ]
  }, [stats])

  async function assign() {
    const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId, ...hw }) })
    setMsg(res.ok ? 'Zadano pracę domową całej klasie ✔' : 'Nie udało się zadać pracy. Spróbuj ponownie.')
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-slate-800 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-extrabold sm:text-3xl">📊 Panel nauczyciela</h1>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Klasa" value={classId} onChange={e => setClassId(e.target.value)} className="rounded-lg border px-3 py-2">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex overflow-hidden rounded-lg border">
            {RANGES.map(([d, l]) => <button key={d} onClick={() => setRange(d)} className={`px-3 py-2 ${range === d ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{l}</button>)}
          </div>
          <a href={`/api/classes/${classId}/report.pdf?range=${range}`} className="rounded-lg bg-slate-800 px-3 py-2 text-white">📄 Raport PDF</a>
          <a href={`/api/classes/${classId}/diplomas.pdf`} className="rounded-lg bg-amber-500 px-3 py-2 font-semibold">🏆 Dyplomy</a>
        </div>
      </header>

      {isLoading && <p role="status">Ładowanie danych…</p>}
      {error && <p className="rounded-lg bg-amber-100 p-3 text-amber-900">Brak połączenia z API – wyświetlam dane demonstracyjne.</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-extrabold">{value}</p></div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow"><h2 className="mb-2 font-bold">Czas i ukończenia wg modułu</h2>
          <ResponsiveContainer width="100%" height={260}><BarChart data={stats?.byModule ?? []}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="module" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="minutes" name="Minuty" fill="#6366f1" radius={[6, 6, 0, 0]} /><Bar dataKey="completed" name="Ukończone" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        <div className="rounded-2xl bg-white p-4 shadow"><h2 className="mb-2 font-bold">Aktywność klasy w tygodniu</h2>
          <ResponsiveContainer width="100%" height={260}><LineChart data={stats?.weekly ?? []}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="minutes" name="Minuty" stroke="#f59e0b" strokeWidth={3} dot />
          </LineChart></ResponsiveContainer></div>
      </section>

      <section className="overflow-x-auto rounded-2xl bg-white p-4 shadow"><h2 className="mb-2 font-bold">Uczniowie</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-2">Pseudonim</th><th>Poziom</th><th>Czas</th><th>Ukończone moduły</th><th>Błędy</th><th>Ostatnio</th><th /></tr></thead>
          <tbody>{(stats?.students ?? []).sort((a, b) => b.errorRate - a.errorRate).map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2 font-semibold">{s.nickname}</td><td>{s.level}</td><td>{s.minutes} min</td>
              <td><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-500" style={{ width: `${100 * s.completed / s.total}%` }} /></div><span className="text-xs">{s.completed}/{s.total}</span></td>
              <td className={s.errorRate > ERROR_ALERT ? 'font-bold text-red-600' : ''}>{Math.round(s.errorRate * 100)}%</td><td>{s.lastActive}</td>
              <td>{s.errorRate > ERROR_ALERT && <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">potrzebuje wsparcia</span>}</td>
            </tr>))}</tbody>
        </table>
      </section>

      <section className="rounded-2xl bg-indigo-50 p-4 print:hidden"><h2 className="mb-2 font-bold">📚 Zadaj pracę domową całej klasie</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Moduł<select value={hw.moduleId} onChange={e => setHw({ ...hw, moduleId: e.target.value })} className="mt-1 block rounded-lg border px-3 py-2">
            {MODULES.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
          <label className="text-sm">Termin<input type="date" value={hw.dueAt} onChange={e => setHw({ ...hw, dueAt: e.target.value })} className="mt-1 block rounded-lg border px-3 py-2" /></label>
          <button onClick={assign} className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white">Zadaj</button>
          {msg && <span role="status" className="text-sm">{msg}</span>}
        </div>
      </section>
    </main>
  )
}
