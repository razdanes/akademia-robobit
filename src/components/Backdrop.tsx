import { useMemo } from 'react'
import { motion } from 'framer-motion'
const ITEMS = ['⚙️', '💾', '🔌', '⭐', '🧩', '🖥️', '⌨️', '🔋', '✨', '🎨', '🚀', '💡']
export default function Backdrop() {
  const items = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ e: ITEMS[i % ITEMS.length], x: Math.random() * 100, y: Math.random() * 100, s: 22 + Math.random() * 30, d: 7 + Math.random() * 8, dl: Math.random() * 4 })), [])
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(125,211,252,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.3) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
      {items.map((it, i) => (
        <motion.div key={i} className="absolute opacity-25" style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: it.s }}
          animate={{ y: [0, -30, 0], rotate: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: it.d, delay: it.dl, ease: 'easeInOut' }}>{it.e}</motion.div>
      ))}
    </div>
  )
}
