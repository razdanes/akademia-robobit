import { useState } from 'react'
import { motion } from 'framer-motion'
import { CATEGORIES, PAGES, Category, ColorPage } from './pages'
import CanvasEditor from './CanvasEditor'

export default function ColoringBook({ done, onDone, onBack }: { done: string[]; onDone: (s: number, id: string) => void; onBack: () => void }) {
  const [cat, setCat] = useState<Category>(CATEGORIES[0]), [page, setPage] = useState<ColorPage | null>(null)
  if (page) return <CanvasEditor svg={page.svg} title={page.title} onBack={() => setPage(null)} onDone={s => onDone(s, page.id)} />
  return (
    <div className="mx-auto max-w-5xl p-4">
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)}
          className={`rounded-full px-4 py-2 font-bold ${cat === c ? 'bg-yellow-300 text-slate-900' : 'bg-white/15'}`}>{c}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {PAGES.filter(p => p.cat === cat).map(p => (
          <motion.button key={p.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }} onClick={() => setPage(p)}
            className="relative rounded-3xl bg-white p-2 text-slate-800 shadow-xl">
            <svg viewBox="0 0 600 450"><g fill="#fff" stroke="#222" strokeWidth="6" dangerouslySetInnerHTML={{ __html: p.svg }} /></svg>
            <div className="font-bold">{p.title}</div>{done.includes(p.id) && <span className="absolute right-2 top-2 text-2xl">⭐</span>}
          </motion.button>))}
      </div>
    </div>
  )
}
