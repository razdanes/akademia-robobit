// Lekka telemetria offline-first: podejścia zapisują się lokalnie i wysyłają do API, gdy jest VITE_API_URL i internet.
interface Att { id: string; module: string; startedAt: string; endedAt?: string; durationS?: number; completed: boolean }
const KEY = 'robobit-events'
let cur: Att | null = null
const load = (): Att[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
const save = (a: Att[]) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-500))) } catch {} }
export const startAttempt = (module: string) => { cur = { id: crypto.randomUUID(), module, startedAt: new Date().toISOString(), completed: false } }
export const markCompleted = () => { if (cur) cur.completed = true }
export function endAttempt() {
  if (!cur) return
  const end = new Date(), a = { ...cur, endedAt: end.toISOString(), durationS: Math.round((+end - +new Date(cur.startedAt)) / 1000) }; cur = null
  if (a.durationS >= 3) save([...load(), a]); void flush()
}
export async function flush() {
  const url = import.meta.env.VITE_API_URL as string | undefined, q = load()
  if (!url || !q.length || !navigator.onLine) return
  try { const r = await fetch(`${url}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: q }) }); if (r.ok) save([]) } catch {}
}
if (typeof window !== 'undefined') window.addEventListener('online', () => void flush())
