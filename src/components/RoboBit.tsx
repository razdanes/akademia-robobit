import { motion } from 'framer-motion'
import { speak } from '../audio'
import { playVoice } from '../voice'
export default function RoboBit({ say, size = 90, voice }: { say?: string; size?: number; voice?: string }) {
  return (
    <div className="flex items-end gap-2">
      <motion.button aria-label="RoboBit" onClick={() => say && (voice ? playVoice(voice, say) : speak(say))}
        animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} whileTap={{ scale: .9 }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <line x1="50" y1="6" x2="50" y2="20" stroke="#fbbf24" strokeWidth="4"/><circle cx="50" cy="6" r="5" fill="#f43f5e"/>
          <rect x="15" y="20" width="70" height="55" rx="18" fill="#38bdf8" stroke="#0369a1" strokeWidth="4"/>
          <circle cx="36" cy="46" r="9" fill="#fff"/><circle cx="64" cy="46" r="9" fill="#fff"/>
          <circle cx="36" cy="46" r="4" fill="#0f172a"/><circle cx="64" cy="46" r="4" fill="#0f172a"/>
          <path d="M38 62 Q50 70 62 62" stroke="#0f172a" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <rect x="30" y="78" width="40" height="16" rx="6" fill="#0ea5e9"/>
        </svg>
      </motion.button>
      {say && <div className="max-w-xs rounded-2xl bg-white px-4 py-2 text-slate-800 text-lg shadow-lg">{say}</div>}
    </div>
  )
}
