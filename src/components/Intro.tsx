import { motion } from 'framer-motion'
import RoboBit from './RoboBit'
const TITLE = 'AKADEMIA ROBOBIT'
export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950 p-4 text-center" exit={{ opacity: 0, scale: 1.3 }} transition={{ duration: .6 }}>
      {Array.from({ length: 24 }, (_, i) => <motion.span key={i} className="absolute text-2xl" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
        animate={{ opacity: [0, 1, 0], scale: [.5, 1.2, .5] }} transition={{ repeat: Infinity, duration: 2 + (i % 4), delay: (i % 6) * .4 }}>✦</motion.span>)}
      <motion.div initial={{ y: -400, scale: .2, rotate: -40, opacity: 0 }} animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, damping: 9 }}><RoboBit size={190} /></motion.div>
      <h1 className="flex flex-wrap justify-center text-4xl font-extrabold sm:text-6xl">
        {[...TITLE].map((c, i) => <motion.span key={i} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .8 + i * .05, type: 'spring' }}
          className="bg-gradient-to-b from-sky-200 to-fuchsia-300 bg-clip-text text-transparent">{c === ' ' ? '\u00A0' : c}</motion.span>)}
      </h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="text-xl text-sky-200">Nauka przez zabawę razem z robotem!</motion.p>
      <motion.button initial={{ scale: 0 }} animate={{ scale: [1, 1.08, 1] }} transition={{ scale: { repeat: Infinity, duration: 1.6, delay: 2.4 }, default: { delay: 2.3 } }}
        whileTap={{ scale: .92 }} onClick={onStart} className="mt-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-12 py-4 text-3xl font-extrabold text-slate-900 shadow-[0_0_40px_rgba(52,211,153,.6)]">▶ Start</motion.button>
    </motion.div>
  )
}
