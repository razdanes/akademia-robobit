import { useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import { ITEMS, Item, Slot } from '../items'
import type { Progress } from '../store'
import { click } from '../audio'
import { playVoice } from '../voice'

const SLOTS: [Slot, string][] = [['color', '🎨 Kolor'], ['hat', '🎩 Czapki'], ['glasses', '🕶️ Okulary']]
export default function Workshop({ p, onBuy, onEquip, onBack }: { p: Progress; onBuy: (i: Item) => void; onEquip: (i: Item) => void; onBack: () => void }) {
  const [slot, setSlot] = useState<Slot>('color'), [msg, setMsg] = useState('Witaj w moim warsztacie! Wybierz, jak mam wyglądać.')
  const bal = p.stars - p.spent
  const tap = (it: Item) => {
    if (p.owned.includes(it.id)) { click(700); onEquip(it); setMsg(`Zakładam: ${it.name}!`) }
    else if (it.req && !p.badges.includes(it.req)) { click(200); setMsg(`Zdobądź odznakę „${it.req}”, żeby to odblokować.`) }
    else if (bal < it.price) { click(200); setMsg(`Brakuje Ci jeszcze ${it.price - bal} ⭐. Zagraj w kolejną grę!`) }
    else { click(880); onBuy(it); setMsg('Kupione! Wyglądam świetnie!') }
  }
  return (
    <div className="mx-auto max-w-5xl p-4 pt-14">
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-b from-indigo-500/40 to-slate-800 p-4">
          <RoboBit size={200} say={msg} voice={msg.startsWith('Witaj') ? 'shop_hello' : undefined} />
          <div className="rounded-full bg-yellow-300 px-5 py-2 text-2xl font-extrabold text-slate-900">⭐ {bal}</div>
        </div>
        <div>
          <div className="mb-3 flex flex-wrap gap-2">{SLOTS.map(([s, n]) => <button key={s} onClick={() => setSlot(s)} className={`rounded-full px-5 py-3 text-lg font-bold ${slot === s ? 'bg-yellow-300 text-slate-900' : 'bg-white/15'}`}>{n}</button>)}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ITEMS.filter(i => i.slot === slot).map(it => {
              const owned = p.owned.includes(it.id), on = p.equipped[it.slot] === it.id, lock = !owned && it.req && !p.badges.includes(it.req)
              return <motion.button key={it.id} whileTap={{ scale: .93 }} whileHover={{ scale: 1.04 }} onClick={() => tap(it)}
                className={`rounded-2xl p-3 text-center shadow-lg ${on ? 'bg-emerald-600 ring-4 ring-white' : 'bg-white/10'}`}>
                <div className="flex h-14 items-center justify-center text-5xl">{it.emoji ?? (it.fill ? <span className="h-12 w-12 rounded-xl border-4" style={{ background: it.fill, borderColor: it.stroke }} /> : '🚫')}</div>
                <div className="font-bold">{it.name}</div>
                <div className="text-sm">{on ? '✔ Założone' : owned ? 'Załóż' : lock ? `🔒 ${it.req}` : `⭐ ${it.price}`}</div>
              </motion.button>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
