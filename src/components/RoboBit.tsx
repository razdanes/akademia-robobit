import { motion } from 'framer-motion'
import { speak } from '../audio'
import { playVoice } from '../voice'
import { useLook } from '../look'
import { ITEMS } from '../items'
export default function RoboBit({ say, size = 90, voice }: { say?: string; size?: number; voice?: string }) {
  const look = useLook(), by = (id?: string) => ITEMS.find(i => i.id === id)
  const col = by(look.color), hat = by(look.hat), gl = by(look.glasses)
  const fill = col?.fill ?? '#38bdf8', stroke = col?.stroke ?? '#0369a1'
  return (
    <div className="flex items-end gap-2">
      <motion.button aria-label="RoboBit" onClick={() => say && (voice ? playVoice(voice, say) : speak(say))}
        animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} whileTap={{ scale: .9 }}>
        <svg width={size} height={size} viewBox="0 0 100 100" overflow="visible">
          <line x1="50" y1="6" x2="50" y2="20" stroke="#fbbf24" strokeWidth="4" /><circle cx="50" cy="6" r="5" fill="#f43f5e" />
          <rect x="15" y="20" width="70" height="55" rx="18" fill={fill} stroke={stroke} strokeWidth="4" />
          <circle cx="36" cy="46" r="9" fill="#fff" /><circle cx="64" cy="46" r="9" fill="#fff" />
          <circle cx="36" cy="46" r="4" fill="#0f172a" /><circle cx="64" cy="46" r="4" fill="#0f172a" />
          <path d="M38 62 Q50 70 62 62" stroke="#0f172a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="30" y="78" width="40" height="16" rx="6" fill={stroke} />
          {gl?.emoji && <text x="50" y="58" fontSize="40" textAnchor="middle">{gl.emoji}</text>}
          {hat?.emoji && <text x="50" y="26" fontSize="44" textAnchor="middle">{hat.emoji}</text>}
        </svg>
      </motion.button>
      {say && <div className="max-w-xs rounded-2xl bg-white px-4 py-2 text-lg text-slate-800 shadow-lg">{say}</div>}
    </div>
  )
}
