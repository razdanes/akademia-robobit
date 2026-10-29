import { motion } from 'framer-motion'
const cols = ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa']
export default function Confetti() {
  return <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
    {Array.from({ length: 70 }).map((_, i) => (
      <motion.div key={i} className="absolute h-3 w-2 rounded-sm" style={{ left: `${Math.random() * 100}%`, background: cols[i % 5] }}
        initial={{ y: -20, rotate: 0 }} animate={{ y: '110vh', rotate: 720 }}
        transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * .6 }} />))}
  </div>
}
