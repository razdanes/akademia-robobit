let ctx: AudioContext | null = null
export function click(freq = 660) {
  try { ctx ??= new AudioContext(); const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 0.08) } catch {}
}
let voice: SpeechSynthesisVoice | undefined
const pick = () => {
  const v = speechSynthesis.getVoices().filter(x => x.lang.toLowerCase().startsWith('pl'))
  // Best first: Edge neural ("Online/Natural"), then Google, then anything Polish.
  voice = v.find(x => /natural|online/i.test(x.name)) || v.find(x => /google/i.test(x.name)) || v[0]
}
try { pick(); speechSynthesis.onvoiceschanged = pick } catch {}
export function speak(text: string, onend?: () => void) {
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text)
    u.lang = 'pl-PL'; if (voice) u.voice = voice; u.pitch = 1.15; u.rate = 0.92; if (onend) { u.onend = onend; u.onerror = onend }; speechSynthesis.speak(u) } catch { onend?.() }
}
