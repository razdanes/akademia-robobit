// Warm, layered generated music (pad + plucked arpeggio + bass + bells + soft drums, with echo).
// Your own files in public/music/{menu,color,game}.mp3 replace it automatically.
export type Track = 'menu' | 'color' | 'game'
const CH = { C: [0, 4, 7], Am: [-3, 0, 4], F: [-7, -3, 0], G: [-5, -1, 2], Cm7: [0, 4, 7, 11], Am7: [-3, 0, 4, 7], Fm7: [-7, -3, 0, 4], G6: [-5, -1, 2, 4] }
interface Cfg { bpm: number; chords: number[][]; arp: number; bell: number; drums: number; pad: number }
const CFG: Record<Track, Cfg> = {
  menu: { bpm: 100, chords: [CH.C, CH.Am, CH.F, CH.G], arp: 2, bell: .35, drums: 1, pad: .03 },
  color: { bpm: 70, chords: [CH.Cm7, CH.Am7, CH.Fm7, CH.G6], arp: 4, bell: .5, drums: 0, pad: .035 },
  game: { bpm: 120, chords: [CH.C, CH.G, CH.Am, CH.F], arp: 2, bell: .15, drums: 2, pad: .026 },
}
const PENT = [0, 2, 4, 7, 9], SEQ = [0, 1, 2, 3, 2, 1, 3, 2]
const KEY = 'robobit-muted'
let muted = (() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })()
let cur: Track | null = null, started = false, ducked = false
let timer: number | undefined, el: HTMLAudioElement | undefined
let ctx: AudioContext | undefined, master: GainNode, bus: GainNode, send: GainNode, noise: AudioBuffer
let nextT = 0, stepN = 0

const level = () => (muted ? 0 : ducked ? .3 : .85)
const applyGain = () => { if (master) master.gain.setTargetAtTime(level(), ctx!.currentTime, .15); if (el) { el.muted = muted; el.volume = ducked ? .12 : .4 } }
export const isMuted = () => muted
export function toggleMute() { muted = !muted; try { localStorage.setItem(KEY, muted ? '1' : '0') } catch {} ; applyGain(); return muted }
export function duck(on: boolean) { ducked = on; applyGain() }
const f = (semi: number) => 261.63 * Math.pow(2, semi / 12)

function init() {
  if (ctx) return
  ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = level()
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination)
  bus = ctx.createGain(); bus.connect(master)
  const delay = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); send = ctx.createGain()
  delay.delayTime.value = .3; fb.gain.value = .35; lp.type = 'lowpass'; lp.frequency.value = 2200; send.gain.value = .3
  send.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master)
  noise = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
}
function tone(freq: number, t: number, hold: number, type: OscillatorType, vol: number, atk: number, rel: number, echo = true) {
  const o = ctx!.createOscillator(), g = ctx!.createGain()
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(bus); if (echo) g.connect(send)
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.setValueAtTime(vol, t + Math.max(atk, hold))
  g.gain.exponentialRampToValueAtTime(.0001, t + hold + rel); o.start(t); o.stop(t + hold + rel + .05)
}
function kick(t: number) {
  const o = ctx!.createOscillator(), g = ctx!.createGain(); o.connect(g); g.connect(master)
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .1)
  g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.start(t); o.stop(t + .25)
}
function hat(t: number) {
  const s = ctx!.createBufferSource(), hp = ctx!.createBiquadFilter(), g = ctx!.createGain(); s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 7000
  s.connect(hp); hp.connect(g); g.connect(master); g.gain.setValueAtTime(.035, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); s.start(t); s.stop(t + .08)
}
function step(c: Cfg, t: number, sd: number) {
  const ch = c.chords[Math.floor(stepN / 16) % c.chords.length], sub = stepN % 16
  if (sub === 0) { ch.forEach(n => tone(f(n - 12), t, sd * 14, 'sine', c.pad, .6, 1)); tone(f(ch[0] - 24), t, sd * 6, 'sine', c.pad * 2, .03, .4, false) }
  if (sub === 8) tone(f(ch[0] - 24), t, sd * 4, 'sine', c.pad * 1.6, .03, .4, false)
  if (sub % c.arp === 0) { const q = SEQ[(sub / c.arp) % 8]; tone(f(ch[q % ch.length] + (q >= ch.length ? 12 : 0)), t, .04, 'triangle', .05, .005, .4) }
  if ((sub === 0 || sub === 6 || sub === 10) && Math.random() < c.bell) {
    const n = PENT[Math.floor(Math.random() * 5)] + (Math.random() < .5 ? 12 : 24)
    tone(f(n), t, .04, 'sine', .035, .005, 1.5); tone(f(n) * 2.01, t, .02, 'sine', .01, .005, .8)
  }
  if (c.drums === 2 && (sub === 0 || sub === 8)) kick(t)
  if (c.drums >= 1 && sub % 4 === 2) hat(t)
}
function synth(tr: Track) {
  init(); ctx!.resume().catch(() => {}); const c = CFG[tr], sd = 60 / c.bpm / 4
  stepN = 0; nextT = ctx!.currentTime + .1
  timer = window.setInterval(() => { while (nextT < ctx!.currentTime + .25) { step(c, nextT, sd); nextT += sd; stepN++ } }, 80)
}
function stop() { clearInterval(timer); timer = undefined; if (el) { el.pause(); el = undefined } }
function play() {
  stop(); const tr = cur; if (!tr) return
  fetch(`/music/${tr}.mp3`, { method: 'HEAD' }).then(r => {
    if (cur !== tr) return
    if (r.ok && (r.headers.get('content-type') || '').includes('audio')) { el = new Audio(`/music/${tr}.mp3`); el.loop = true; applyGain(); el.play().catch(() => {}) } else synth(tr)
  }).catch(() => cur === tr && synth(tr))
}
export function setMusic(t: Track | null) { if (t === cur) return; cur = t; if (started) play() }
if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (!started) { started = true; play() } }, { once: true })
