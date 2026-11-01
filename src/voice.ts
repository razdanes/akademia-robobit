// Plays /voice/<id>.mp3 if the file exists (see nagrania/lista-nagran.md); otherwise reads the line with the browser voice.
// Files are fetched as blobs so the service worker can cache them and they play offline.
import lines from './voiceLines.json'
import { speak } from './audio'
import { duck, isMuted } from './music'
const TTS_FALLBACK = true // set to false to stay silent for lines without an mp3
const TXT: Record<string, string> = {}
;(lines as { id: string; text: string }[]).forEach(l => (TXT[l.id] = l.text))
const blobs = new Map<string, Promise<string | null>>()
const load = (id: string) => {
  if (!blobs.has(id)) blobs.set(id, fetch(`/voice/${id}.mp3`).then(r => (r.ok && (r.headers.get('content-type') || '').includes('audio') ? r.blob().then(b => URL.createObjectURL(b)) : null)).catch(() => null))
  return blobs.get(id)!
}
let token = 0, el: HTMLAudioElement | undefined
function stop() { token++; el?.pause(); el = undefined; try { speechSynthesis.cancel() } catch {} }
async function one(id: string, fallback: string | undefined, my: number) {
  if (my !== token || isMuted()) return
  const url = await load(id)
  if (my !== token) return
  if (url) await new Promise<void>(res => { el = new Audio(url); el.onended = el.onerror = () => res(); el.play().catch(() => res()) })
  else if (TTS_FALLBACK) { const t = TXT[id] || fallback; if (t) await new Promise<void>(res => speak(t, res)) }
}
export function playVoice(id: string, fallback?: string) { stop(); duck(true); const my = token; void one(id, fallback, my).finally(() => { if (my === token) duck(false) }) }
export function playVoiceIfFile(id: string) { void load(id).then(u => u && playVoice(id)) }
export async function playSeq(ids: string[]) { stop(); const my = token; duck(true); for (const id of ids) { if (my !== token) return; await one(id, undefined, my) } if (my === token) duck(false) }
