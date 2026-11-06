let ctx: AudioContext | null = null
export function click(freq = 660) {
  try { ctx ??= new AudioContext(); const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 0.08) } catch {}
}
// Głos robota: domyślnie męski (niższy). Przełącznik w menu: męski ↔ oryginalny.
const VKEY = 'robobit-voice'
let male = (() => { try { return localStorage.getItem(VKEY) !== 'orig' } catch { return true } })()
export const isMaleVoice = () => male
export function toggleVoice() { male = !male; try { localStorage.setItem(VKEY, male ? 'male' : 'orig') } catch {} ; return male }
const FEM = /zofia|paulina|agnieszka|ewa|maja|anna|kasia|female|kobiet/i, MAL = /marek|adam|jacek|krzysztof|maciej|piotr|male|mężczyz/i
const voices: { best?: SpeechSynthesisVoice; male?: SpeechSynthesisVoice } = {}
const pick = () => {
  const v = speechSynthesis.getVoices().filter(x => x.lang.toLowerCase().startsWith('pl'))
  voices.best = v.find(x => /natural|online/i.test(x.name)) || v.find(x => /google/i.test(x.name)) || v[0]
  voices.male = v.find(x => MAL.test(x.name) && !FEM.test(x.name))   // np. „Microsoft Marek Online (Natural)” w Edge
}
try { pick(); speechSynthesis.onvoiceschanged = pick } catch {}
export function speak(text: string, onend?: () => void) {
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text), v = male ? (voices.male ?? voices.best) : voices.best
    u.lang = 'pl-PL'; if (v) u.voice = v
    u.pitch = male ? (voices.male ? .9 : .55) : 1.1; u.rate = male ? .9 : .95   // bez męskiego głosu w systemie obniżamy wysokość
    if (onend) { u.onend = onend; u.onerror = onend }
    speechSynthesis.speak(u)
  } catch { onend?.() }
}
