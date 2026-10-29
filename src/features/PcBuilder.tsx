import { useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click, speak } from '../audio'
import { playVoice, playSeq } from '../voice'

interface Step { id: string; icon: string; name: string; what: string; why: string; hint: string; color: string }
const STEPS: Step[] = [
  { id: 'case', icon: '🗄️', name: 'Obudowa', color: '#64748b', what: 'Obudowa to „dom” komputera. Chroni części przed kurzem i uderzeniami.', why: 'Ma otwory i wentylatory, żeby w środku płynęło chłodne powietrze.', hint: 'Dotknij dużej ramki dookoła całego komputera.' },
  { id: 'board', icon: '🧩', name: 'Płyta główna', color: '#16a34a', what: 'Płyta główna łączy wszystkie części ze sobą – jak miasto z drogami.', why: 'Wkręcamy ją w obudowę. Każda część wpina się w inne gniazdo na płycie.', hint: 'To duża zielona płyta w środku obudowy.' },
  { id: 'cpu', icon: '🧠', name: 'Procesor (CPU)', color: '#f59e0b', what: 'Procesor to mózg komputera. Liczy i wykonuje polecenia.', why: 'Wkładamy go w kwadratowe gniazdo na płycie. Uważaj na delikatne złote nóżki!', hint: 'Szukaj małego kwadratu w lewym górnym rogu płyty.' },
  { id: 'cooler', icon: '❄️', name: 'Chłodzenie', color: '#38bdf8', what: 'Procesor bardzo się grzeje, jak silnik w samochodzie.', why: 'Chłodzenie z wentylatorem stawiamy na procesorze i wywiewa ciepło. Bez niego komputer by się zawiesił.', hint: 'Połóż je na procesorze – dotknij jeszcze raz w tym samym miejscu.' },
  { id: 'ram', icon: '⚡', name: 'Pamięć RAM', color: '#a855f7', what: 'RAM to pamięć na chwilę. Trzyma to, co robisz teraz, np. otwartą grę.', why: 'Wpinamy ją w długie wąskie sloty obok procesora. Po wyłączeniu prądu RAM wszystko zapomina.', hint: 'Cztery długie, pionowe sloty obok procesora.' },
  { id: 'ssd', icon: '💾', name: 'Dysk SSD', color: '#ef4444', what: 'Dysk to schowek. Tu na stałe mieszkają system, gry i zdjęcia.', why: 'Mały dysk M.2 wpinamy w gniazdo na płycie. SSD jest dużo szybszy niż stary dysk z talerzami.', hint: 'Małe, płaskie gniazdo pod procesorem.' },
  { id: 'gpu', icon: '🎮', name: 'Karta graficzna', color: '#ec4899', what: 'Karta graficzna rysuje obraz na ekranie. Ważna w grach i filmach.', why: 'Wsuwamy ją w najdłuższe gniazdo PCIe aż kliknie.', hint: 'Najdłuższe poziome gniazdo na dole płyty.' },
  { id: 'psu', icon: '🔌', name: 'Zasilacz', color: '#eab308', what: 'Zasilacz zamienia prąd z gniazdka na bezpieczny prąd dla części.', why: 'Kable z zasilacza idą do płyty, karty graficznej i dysku. To „serce”, które daje energię.', hint: 'Prostokąt w prawym dolnym rogu obudowy.' },
]
const Z: Record<string, { x: number; y: number; w: number; h: number }> = {
  case: { x: 10, y: 10, w: 380, h: 280 }, board: { x: 25, y: 25, w: 240, h: 210 }, psu: { x: 285, y: 190, w: 95, h: 90 },
  ssd: { x: 50, y: 125, w: 70, h: 24 }, gpu: { x: 45, y: 175, w: 200, h: 24 }, ram: { x: 140, y: 40, w: 100, h: 90 },
  cpu: { x: 50, y: 45, w: 60, h: 60 }, cooler: { x: 42, y: 37, w: 76, h: 76 },
}
const ORDER = ['case', 'board', 'psu', 'ssd', 'gpu', 'ram', 'cpu', 'cooler']

export default function PcBuilder({ onWin, onBack }: { onWin: (s: number) => void; onBack: () => void }) {
  const [i, setI] = useState(0), [ok, setOk] = useState(false), [booted, setBooted] = useState(false)
  const [vid, setVid] = useState('pc_intro'), [msg, setMsg] = useState('Zbudujmy komputer! Dotknij miejsca, w którym ma być pierwsza część.')
  const s = STEPS[i], placed = STEPS.slice(0, i + (ok ? 1 : 0)).map(x => x.id)
  const tap = (id: string) => {
    if (ok || booted) return
    if (id === s.id) { click(880); setOk(true); setMsg(`${s.what} ${s.why}`); playVoice(`pc_part_${s.id}`); setVid(`pc_part_${s.id}`) }
    else { click(200); setMsg(`Hmm, to nie tutaj. Podpowiedź: ${s.hint}`); playVoice(`pc_hint_${s.id}`); setVid(`pc_hint_${s.id}`) }
  }
  const next = () => {
    if (i < STEPS.length - 1) { setI(i + 1); setOk(false); setMsg(`Teraz: ${STEPS[i + 1].name}. Gdzie to zamontujemy?`); playVoice(`pc_ask_${STEPS[i + 1].id}`); setVid(`pc_ask_${STEPS[i + 1].id}`) }
    else { setBooted(true); onWin(8); setMsg('Komputer działa! Wszystkie części współpracują.'); playVoice('pc_done'); setVid('pc_done') }
  }
  return (
    <div className="mx-auto max-w-5xl p-4">
      {booted && <Confetti />}
      <button onClick={onBack} className="mb-3 rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      <RoboBit say={msg} voice={vid} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <svg viewBox="0 0 400 300" className="w-full rounded-3xl bg-slate-800 p-2">
          {ORDER.filter(id => id !== 'cooler' || placed.includes('cpu')).map(id => {
            const z = Z[id], st = STEPS.find(x => x.id === id)!, on = placed.includes(id)
            return <g key={id} onClick={() => tap(id)} className="cursor-pointer">
              <motion.rect x={z.x} y={z.y} width={z.w} height={z.h} rx={8}
                fill={on ? st.color : id === 'case' ? '#1e293b' : 'rgba(255,255,255,.06)'} fillOpacity={on ? (id === 'case' || id === 'board' ? .45 : .9) : 1}
                stroke={on ? '#fff' : '#7dd3fc'} strokeDasharray={on ? undefined : '6 4'} strokeWidth={2}
                animate={!on && id === s.id && !ok && i === 0 ? { opacity: [.5, 1, .5] } : {}} transition={{ repeat: Infinity, duration: 1.5 }} />
              {on && id !== 'case' && id !== 'board' && <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 7} textAnchor="middle" fontSize={z.h > 40 ? 22 : 15}>{st.icon}</text>}
              {on && (id === 'case' || id === 'board') && <text x={z.x + 8} y={z.y + 18} fontSize="12" fill="#fff">{st.name}</text>}
            </g>
          })}
        </svg>
        <div className="rounded-3xl bg-white/10 p-5">
          {!booted ? <>
            <div className="text-sm text-sky-300">Krok {i + 1} z {STEPS.length}</div>
            <div className="text-3xl font-extrabold">{s.icon} {s.name}</div>
            {!ok ? <p className="mt-3 text-xl">Dotknij na schemacie miejsca, gdzie ta część pasuje.</p> : <>
              <p className="mt-3 text-xl">{s.what}</p><p className="mt-2 text-lg text-slate-200">🔧 {s.why}</p>
              <button onClick={next} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">{i < STEPS.length - 1 ? 'Dalej →' : '⏻ Włącz komputer!'}</button></>}
          </> : <>
            <div className="text-3xl font-extrabold">🎉 Działa!</div>
            <ul className="mt-3 space-y-1 text-lg">{STEPS.map(x => <li key={x.id}>{x.icon} <b>{x.name}</b> – {x.what.split('.')[0]}.</li>)}</ul>
          </>}
        </div>
      </div>
    </div>
  )
}
