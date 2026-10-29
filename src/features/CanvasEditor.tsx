import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Confetti from '../components/Confetti'
import RoboBit from '../components/RoboBit'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'
import { PALETTE } from '../palette'

const W = 600, H = 450
type Tool = 'brush' | 'fill' | 'eraser' | 'rect' | 'circle'

interface Props { svg?: string; title: string; shapes?: boolean; onDone: (stars: number) => void; onBack: () => void }

export default function CanvasEditor({ svg, title, shapes, onDone, onBack }: Props) {
  const paint = useRef<HTMLCanvasElement>(null), lines = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('brush'), [color, setColor] = useState(PALETTE[0]), [size, setSize] = useState(14)
  const [hist, setHist] = useState<ImageData[]>([]), [redo, setRedo] = useState<ImageData[]>([])
  const [party, setParty] = useState(false)
  const drawing = useRef(false), last = useRef<[number, number]>([0, 0]), start = useRef<[number, number]>([0, 0]), snap = useRef<ImageData | null>(null)
  const ctx = () => paint.current!.getContext('2d', { willReadFrequently: true })!

  useEffect(() => {
    const c = ctx(); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H)
    const l = lines.current!.getContext('2d', { willReadFrequently: true })!; l.clearRect(0, 0, W, H)
    if (svg) {
      const img = new Image()
      img.onload = () => { l.drawImage(img, 0, 0, W, H); const d = l.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const a = Math.min(255, (255 - d.data[i]) * 1.6) * (d.data[i + 3] / 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = 30; d.data[i + 3] = a } l.putImageData(d, 0, 0) }
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g fill="#fff" stroke="#222" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${svg}</g></svg>`)
    }
    setHist([c.getImageData(0, 0, W, H)])
  }, [svg])

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = paint.current!.getBoundingClientRect()
    return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]
  }
  const commit = useCallback(() => { setHist(h => [...h.slice(-29), ctx().getImageData(0, 0, W, H)]); setRedo([]) }, [])

  const floodFill = (sx: number, sy: number) => {
    const c = ctx(), img = c.getImageData(0, 0, W, H), d = img.data
    const wall = lines.current!.getContext('2d')!.getImageData(0, 0, W, H).data
    const x0 = Math.floor(sx), y0 = Math.floor(sy), i0 = (y0 * W + x0) * 4
    if (wall[i0 + 3] > 40) return
    const t = [d[i0], d[i0 + 1], d[i0 + 2]]
    const n = parseInt(color.slice(1), 16), fr = n >> 16, fg = (n >> 8) & 255, fb = n & 255
    if (t[0] === fr && t[1] === fg && t[2] === fb) return
    const stack = [x0, y0]
    while (stack.length) {
      const y = stack.pop()!, x = stack.pop()!
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const i = (y * W + x) * 4
      if (wall[i + 3] > 40 || d[i] !== t[0] || d[i + 1] !== t[1] || d[i + 2] !== t[2]) continue
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
    }
    c.putImageData(img, 0, 0)
  }

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId)
    const p = pos(e); click(500)
    if (tool === 'fill') { floodFill(...p); commit(); return }
    drawing.current = true; last.current = p; start.current = p; snap.current = ctx().getImageData(0, 0, W, H)
    if (tool === 'brush' || tool === 'eraser') move(e)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const c = ctx(), p = pos(e)
    if (tool === 'brush' || tool === 'eraser') {
      c.strokeStyle = tool === 'eraser' ? '#fff' : color; c.lineWidth = tool === 'eraser' ? size * 1.8 : size; c.lineCap = c.lineJoin = 'round'
      c.beginPath(); c.moveTo(...last.current); c.lineTo(p[0] + .01, p[1]); c.stroke(); last.current = p
    } else {
      c.putImageData(snap.current!, 0, 0); c.strokeStyle = color; c.lineWidth = size / 2
      const [x, y] = start.current
      if (tool === 'rect') c.strokeRect(x, y, p[0] - x, p[1] - y)
      else { c.beginPath(); c.arc(x, y, Math.hypot(p[0] - x, p[1] - y), 0, 7); c.stroke() }
    }
  }
  const up = () => { if (drawing.current) { drawing.current = false; commit() } }

  const restore = (img: ImageData) => ctx().putImageData(img, 0, 0)
  const undo = () => { if (hist.length < 2) return; const cur = hist[hist.length - 1]; restore(hist[hist.length - 2]); setHist(hist.slice(0, -1)); setRedo([...redo, cur]) }
  const doRedo = () => { const n = redo[redo.length - 1]; if (!n) return; restore(n); setHist([...hist, n]); setRedo(redo.slice(0, -1)) }

  const save = () => {
    const o = document.createElement('canvas'); o.width = W; o.height = H
    const c = o.getContext('2d')!; c.drawImage(paint.current!, 0, 0); c.drawImage(lines.current!, 0, 0)
    const a = document.createElement('a'); a.download = `${title}.png`; a.href = o.toDataURL('image/png'); a.click()
  }
  const finish = () => { setParty(true); playVoice('color_done'); onDone(3); setTimeout(() => setParty(false), 4500) }

  const tools: [Tool, string][] = [['brush', '🖌️'], ['fill', '🪣'], ['eraser', '🧽'], ...(shapes ? [['rect', '▭'], ['circle', '◯']] as [Tool, string][] : [])]
  const btn = 'h-14 w-14 rounded-2xl text-2xl font-bold shadow-lg'
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 p-3">
      {party && <Confetti />}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-full bg-white/20 px-4 py-2 text-lg">← Wróć</button>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <RoboBit size={56} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex gap-2 md:flex-col">
          {tools.map(([t, ic]) => <motion.button key={t} whileTap={{ scale: .9 }} onClick={() => setTool(t)}
            className={`${btn} ${tool === t ? 'bg-yellow-300 text-slate-900 ring-4 ring-white' : 'bg-sky-500'}`}>{ic}</motion.button>)}
          <button onClick={undo} className={`${btn} bg-slate-600`} aria-label="Cofnij">↶</button>
          <button onClick={doRedo} className={`${btn} bg-slate-600`} aria-label="Ponów">↷</button>
        </div>
        <div className="relative w-full flex-1 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl" style={{ aspectRatio: `${W}/${H}` }}>
          <canvas ref={paint} width={W} height={H} className="absolute inset-0 h-full w-full" />
          <canvas ref={lines} width={W} height={H} className="absolute inset-0 h-full w-full"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PALETTE.map(c => <motion.button key={c} whileTap={{ scale: .85 }} onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush') }}
          className={`h-8 w-8 rounded-full border-4 ${color === c ? 'border-yellow-300 scale-110' : 'border-white'}`} style={{ background: c }} aria-label={c} />)}
        <input type="range" min={4} max={40} value={size} onChange={e => setSize(+e.target.value)} className="mx-3 w-28" aria-label="Rozmiar" />
        <button onClick={save} className="rounded-full bg-emerald-500 px-5 py-3 text-lg font-bold">💾 Zapisz PNG</button>
        <button onClick={finish} className="rounded-full bg-pink-500 px-5 py-3 text-lg font-bold">⭐ Gotowe!</button>
      </div>
    </div>
  )
}
