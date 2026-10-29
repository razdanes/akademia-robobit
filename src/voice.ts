// Plays /voice/<id>.mp3 if the file exists (see nagrania/lista-nagran.md); otherwise reads the line with the browser voice.
import lines from './voiceLines.json'
import { speak } from './audio'
import { duck, isMuted } from './music'
const TXT: Record<string, string> = {}
;(lines as { id: string; text: string }[]).forEach(l => (TXT[l.id] = l.text))
const have = new Map<string, Promise<boolean>>()
const exists = (id: string) => {
  if (!have.has(id)) have.set(id, fetch(`/voice/${id}.mp3`, { method: 'HEAD' }).then(r => r.ok && (r.headers.get('content-type') || '').includes('audio')).catch(() => false))
  return have.get(id)!
}
let token = 0, el: HTMLAudioElement | undefined
function stop() { token++; el?.pause(); el = undefined; try { speechSynthesis.cancel() } catch {} }
async function one(id: string, fallback: string | undefined, my: number) {
  if (my !== token || isMuted()) return
  if (await exists(id)) { if (my !== token) return; await new Promise<void>(res => { el = new Audio(`/voice/${id}.mp3`); el.onended = el.onerror = () => res(); el.play().catch(() => res()) }) }
  else { const t = TXT[id] || fallback; if (t) await new Promise<void>(res => speak(t, res)) }
}
export function playVoice(id: string, fallback?: string) { stop(); duck(true); const my = token; void one(id, fallback, my).finally(() => { if (my === token) duck(false) }) }
export function playVoiceIfFile(id: string) { void exists(id).then(ok => ok && playVoice(id)) }
export async function playSeq(ids: string[]) { stop(); const my = token; duck(true); for (const id of ids) { if (my !== token) return; await one(id, undefined, my) } if (my === token) duck(false) }
