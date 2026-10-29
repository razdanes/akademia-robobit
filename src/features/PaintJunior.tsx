import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Confetti from '../components/Confetti'
import RoboBit from '../components/RoboBit'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'
import { PALETTE } from '../palette'

const W = 600, H = 450
type Tool = 'brush' | 'rainbow' | 'spray' | 'eraser' | 'fill' | 'line' | 'rect' | 'circle' | 'tri' | 'star' | 'stamp'
const TOOLS: [Tool, string, string][] = [['brush', '🖌️', 'Pędzel'], ['rainbow', '🌈', 'Tęcza'], ['spray', '💨', 'Spray'], ['eraser', '🧽', 'Gumka'], ['fill', '🪣', 'Wypełnij'],
  ['line', '📏', 'Linia'], ['rect', '▭', 'Prostokąt'], ['circle', '◯', 'Koło'], ['tri', '△', 'Trójkąt'], ['star', '★', 'Gwiazda'], ['stamp', '🤖', 'Pieczątka']]
const STAMPS = ['🤖', '⭐', '❤️', '🚀', '🐱', '🐶', '🌈', '☀️', '🌸', '🚗', '💻', '👾']
const BGS = [['white', 'Biała'], ['sky', 'Niebo'], ['space', 'Kosmos'], ['sea', 'Morze']]
type Pt = [number, number]

function drawBg(c: CanvasRenderingContext2D, kind: string) {
  const g = (a: string, b: string) => { const q = c.createLinearGradient(0, 0, 0, H); q.addColorStop(0, a); q.addColorStop(1, b); c.fillStyle = q; c.fillRect(0, 0, W, H) }
  if (kind === 'sky') { g('#7dd3fc', '#e0f2fe'); c.fillStyle = '#4ade80'; c.fillRect(0, 340, W, 110); c.fillStyle = '#fde047'; c.beginPath(); c.arc(520, 80, 40, 0, 7); c.fill() }
  else if (kind === 'space') { c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + .5, 0, 7); c.fill() } }
  else if (kind === 'sea') g('#67e8f9', '#0369a1')
  else { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H) }
}
function shape(c: CanvasRenderingContext2D, t: Tool, a: Pt, b: Pt, filled: boolean) {
  c.beginPath()
  if (t === 'line') { c.moveTo(...a); c.lineTo(...b); c.stroke(); return }
  if (t === 'rect') c.rect(a[0], a[1], b[0] - a[0], b[1] - a[1])
  else if (t === 'circle') c.arc(a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 0, 7)
  else if (t === 'tri') { c.moveTo((a[0] + b[0]) / 2, a[1]); c.lineTo(a[0], b[1]); c.lineTo(b[0], b[1]); c.closePath() }
  else if (t === 'star') { const rad = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let i = 0; i < 10; i++) { const ang = Math.PI * i / 5 - Math.PI / 2, q = i % 2 ? rad * .45 : rad; c.lineTo(a[0] + q * Math.cos(ang), a[1] + q * Math.sin(ang)) } c.closePath() }
  filled ? c.fill() : c.stroke()
}

export default function PaintJunior({ onDone, onBack }: { onDone: (s: number) => void; onBack: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('brush'), [color, setColor] = useState(PALETTE[0]), [size, setSize] = useState(12), [filled, setFilled] = useState(false), [stamp, setStamp] = useState(STAMPS[0])
  const [hist, setHist] = useState<ImageData[]>([]), [redo, setRedo] = useState<ImageData[]>([]), [party, setParty] = useState(false)
  const drawing = useRef(false), last = useRef<Pt>([0, 0]), start = useRef<Pt>([0, 0]), snap = useRef<ImageData | null>(null), hue = useRef(0)
  const ctx = () => cv.current!.getContext('2d', { willReadFrequently: true })!
  const push = () => { setHist(h => [...h.slice(-29), ctx().getImageData(0, 0, W, H)]); setRedo([]) }
  const newPage = (bg: string) => { drawBg(ctx(), bg); setHist([ctx().getImageData(0, 0, W, H)]); setRedo([]) }
  useEffect(() => { newPage('white') }, [])

  const pos = (e: React.PointerEvent): Pt => { const r = cv.current!.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height] }
  const fill = (sx: number, sy: number) => {
    const c = ctx(), img = c.getImageData(0, 0, W, H), d = img.data, i0 = (Math.floor(sy) * W + Math.floor(sx)) * 4
    const t = [d[i0], d[i0 + 1], d[i0 + 2]], n = parseInt(color.slice(1), 16), f = [n >> 16, (n >> 8) & 255, n & 255]
    if (Math.abs(t[0] - f[0]) + Math.abs(t[1] - f[1]) + Math.abs(t[2] - f[2]) < 10) return
    const seen = new Uint8Array(W * H), st = [Math.floor(sx), Math.floor(sy)]
    while (st.length) {
      const y = st.pop()!, x = st.pop()!
      if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue
      seen[y * W + x] = 1; const i = (y * W + x) * 4
      if (Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) > 60) continue
      d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; d[i + 3] = 255
      st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
    }
    c.putImageData(img, 0, 0)
  }
  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId); const p = pos(e), c = ctx(); click(500)
    if (tool === 'fill') { fill(...p); push(); return }
    if (tool === 'stamp') { c.font = `${size * 3 + 30}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(stamp, p[0], p[1]); push(); return }
    drawing.current = true; last.current = p; start.current = p; snap.current = c.getImageData(0, 0, W, H); move(e)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const c = ctx(), p = pos(e)
    c.lineCap = c.lineJoin = 'round'; c.lineWidth = size; c.strokeStyle = c.fillStyle = color
    if (tool === 'brush' || tool === 'eraser' || tool === 'rainbow') {
      if (tool === 'eraser') { c.strokeStyle = '#fff'; c.lineWidth = size * 1.8 }
      if (tool === 'rainbow') { hue.current = (hue.current + 6) % 360; c.strokeStyle = `hsl(${hue.current} 90% 55%)` }
      c.beginPath(); c.moveTo(...last.current); c.lineTo(p[0] + .01, p[1]); c.stroke(); last.current = p
    } else if (tool === 'spray') {
      for (let i = 0; i < 14; i++) { const a = Math.random() * 7, r = Math.random() * size * 1.6; c.fillRect(p[0] + r * Math.cos(a), p[1] + r * Math.sin(a), 2, 2) }
    } else { c.putImageData(snap.current!, 0, 0); c.lineWidth = Math.max(3, size / 2); shape(c, tool, start.current, p, filled) }
  }
  const up = () => { if (drawing.current) { drawing.current = false; push() } }
  const undo = () => { if (hist.length < 2) return; ctx().putImageData(hist[hist.length - 2], 0, 0); setRedo([...redo, hist[hist.length - 1]]); setHist(hist.slice(0, -1)) }
  const doRedo = () => { const n = redo[redo.length - 1]; if (!n) return; ctx().putImageData(n, 0, 0); setHist([...hist, n]); setRedo(redo.slice(0, -1)) }
  const save = () => { const a = document.createElement('a'); a.download = 'moj-rysunek.png'; a.href = cv.current!.toDataURL('image/png'); a.click() }
  const finish = () => { setParty(true); playVoice('paint_done'); onDone(2); setTimeout(() => setParty(false), 4500) }

  const btn = 'rounded-2xl px-3 py-2 text-lg font-bold shadow'
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 p-3">
      {party && <Confetti />}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-full bg-white/20 px-4 py-2 text-lg">← Wróć</button>
        <h2 className="text-2xl font-extrabold">Paint Junior</h2><RoboBit size={56} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="grid grid-cols-6 gap-1 md:w-44 md:grid-cols-2">
          {TOOLS.map(([t, ic, name]) => <motion.button key={t} whileTap={{ scale: .9 }} onClick={() => setTool(t)} title={name}
            className={`${btn} ${tool === t ? 'bg-yellow-300 text-slate-900 ring-4 ring-white' : 'bg-sky-500'}`}>{t === 'stamp' ? stamp : ic}<span className="hidden text-xs md:block">{name}</span></motion.button>)}
          <button onClick={undo} className={`${btn} bg-slate-600`} aria-label="Cofnij">↶</button>
          <button onClick={doRedo} className={`${btn} bg-slate-600`} aria-label="Ponów">↷</button>
        </div>
        <div className="w-full flex-1">
          <canvas ref={cv} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            className="w-full rounded-3xl border-4 border-white bg-white shadow-2xl" style={{ aspectRatio: `${W}/${H}` }} />
        </div>
      </div>
      {tool === 'stamp' && <div className="flex flex-wrap justify-center gap-2">{STAMPS.map(s => <button key={s} onClick={() => setStamp(s)} className={`h-12 w-12 rounded-xl text-3xl ${stamp === s ? 'bg-yellow-300' : 'bg-white/15'}`}>{s}</button>)}</div>}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PALETTE.map(c => <motion.button key={c} whileTap={{ scale: .85 }} onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush') }} aria-label={c}
          className={`h-8 w-8 rounded-full border-4 ${color === c ? 'scale-110 border-yellow-300' : 'border-white'}`} style={{ background: c }} />)}
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-11 w-11 rounded-full" aria-label="Własny kolor" />
        <input type="range" min={4} max={40} value={size} onChange={e => setSize(+e.target.value)} className="mx-2 w-28" aria-label="Rozmiar" />
        <label className="flex items-center gap-2 text-lg"><input type="checkbox" checked={filled} onChange={e => setFilled(e.target.checked)} className="h-5 w-5" /> Pełne kształty</label>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-slate-300">Nowa kartka:</span>
        {BGS.map(([id, n]) => <button key={id} onClick={() => confirm('Zacząć nową kartkę? Obecny rysunek zniknie.') && newPage(id)} className="rounded-full bg-white/15 px-4 py-2">{n}</button>)}
        <button onClick={save} className="rounded-full bg-emerald-500 px-5 py-3 text-lg font-bold">💾 Zapisz PNG</button>
        <button onClick={finish} className="rounded-full bg-pink-500 px-5 py-3 text-lg font-bold">⭐ Gotowe!</button>
      </div>
    </div>
  )
}
