import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import RoboBit from '../components/RoboBit'
import Confetti from '../components/Confetti'
import { click } from '../audio'
import { playVoice } from '../voice'

interface Opt { t: string; ok: boolean; why: string }
interface Sc { icon: string; title: string; story: string; opts: Opt[] }
const SC: Sc[] = [
  { icon: '💬', title: 'Nieznajomy w czacie', story: 'W grze pisze do Ciebie ktoś nieznajomy: „Cześć! Podaj, gdzie mieszkasz, to wyślę Ci prezent!”', opts: [
    { t: 'Podaję mój adres', ok: false, why: 'Nigdy nie podajemy adresu nieznajomym. Nie wiesz, kim naprawdę jest ta osoba.' },
    { t: 'Nie odpisuję i mówię rodzicowi lub nauczycielowi', ok: true, why: 'Super! Dorosły pomoże Ci zablokować nieznajomego.' },
    { t: 'Pytam, jak się nazywa, i piszę dalej', ok: false, why: 'Lepiej w ogóle nie rozmawiać z nieznajomymi. Powiedz dorosłemu.' }] },
  { icon: '🔑', title: 'Tajne hasło', story: 'Kolega z klasy prosi: „Podaj mi swoje hasło do gry, zagram za Ciebie!”', opts: [
    { t: 'Podaję hasło koledze', ok: false, why: 'Hasło jest tajne. Znają je tylko Ty i rodzice.' },
    { t: 'Nie podaję. To moja tajemnica', ok: true, why: 'Dobrze! Mocne hasło chroni Twoje konto.' },
    { t: 'Zapisuję hasło na kartce i zostawiam w szkole', ok: false, why: 'Kartka może zginąć. Zapamiętaj hasło albo zapisz je razem z rodzicem w bezpiecznym miejscu.' }] },
  { icon: '🎁', title: 'Wygrana telefonu', story: 'Na ekranie wyskakuje napis: „WYGRAŁEŚ NOWY TELEFON! Kliknij tu natychmiast!”', opts: [
    { t: 'Klikam, żeby odebrać nagrodę', ok: false, why: 'Takie napisy to zwykle oszustwo. Kliknięcie może zepsuć komputer.' },
    { t: 'Zamykam okienko i pokazuję dorosłemu', ok: true, why: 'Świetnie! Dorosły sprawdzi, czy wszystko jest w porządku.' },
    { t: 'Wpisuję dane rodziców, żeby dostać nagrodę', ok: false, why: 'Nigdy nie wpisujemy danych rodziców w takich miejscach.' }] },
  { icon: '📸', title: 'Zdjęcie z podwórka', story: 'Chcesz wysłać znajomym zdjęcie z podwórka. Na zdjęciu widać tabliczkę z numerem Twojego domu.', opts: [
    { t: 'Wysyłam od razu', ok: false, why: 'Z takiego zdjęcia można odczytać, gdzie mieszkasz.' },
    { t: 'Pytam rodzica i wybieram zdjęcie bez adresu', ok: true, why: 'Dobrze! Zdjęcia też trzeba sprawdzać przed wysłaniem.' },
    { t: 'Wrzucam zdjęcie tak, żeby widzieli je wszyscy', ok: false, why: 'Publiczne zdjęcie może zobaczyć każdy, także nieznajomi.' }] },
  { icon: '😢', title: 'Przykre słowa', story: 'Ktoś w czacie pisze do Ciebie złośliwe i przykre rzeczy.', opts: [
    { t: 'Odpisuję jeszcze gorszymi słowami', ok: false, why: 'Złość zwykle jeszcze pogarsza sytuację.' },
    { t: 'Nie odpisuję, mówię dorosłemu i blokuję tę osobę', ok: true, why: 'Brawo! Nie jesteś sam. Dorosły Ci pomoże.' },
    { t: 'Nikomu nie mówię, to przecież tylko czat', ok: false, why: 'Powiedz dorosłemu. To nie Twoja wina i można to zgłosić.' }] },
  { icon: '🦈', title: 'Czy to prawda?', story: 'W internecie przeczytałeś zaskakujący tekst: „Rekin potrafi chodzić po lądzie przez cały tydzień!”', opts: [
    { t: 'Wierzę i wysyłam wszystkim znajomym', ok: false, why: 'Nie wszystko w internecie jest prawdą. Nie przekazuj dalej, dopóki nie sprawdzisz.' },
    { t: 'Pytam dorosłego i sprawdzam w innym miejscu, np. w książce', ok: true, why: 'Świetnie! Wiadomości warto sprawdzać w kilku miejscach.' },
    { t: 'Wierzę, bo było napisane', ok: false, why: 'To, że coś jest napisane, nie znaczy, że jest prawdziwe.' }] },
]
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - .5)

export default function SafetyGame({ onEnd, onBack }: { onEnd: (s: number) => void; onBack: () => void }) {
  const order = useMemo(() => SC.map(s => ({ ...s, opts: shuffle(s.opts) })), [])
  const [i, setI] = useState(0), [wrong, setWrong] = useState<number[]>([]), [ok, setOk] = useState<number | null>(null), [first, setFirst] = useState(0), [msg, setMsg] = useState('Przeczytaj historię i wybierz, co zrobisz.')
  const fin = i >= order.length, stars = first >= 5 ? 3 : first >= 3 ? 2 : 1, s = order[Math.min(i, order.length - 1)]
  const pick = (k: number) => {
    if (ok !== null || wrong.includes(k)) return
    const o = s.opts[k]; setMsg(o.why)
    if (o.ok) { click(880); setOk(k); if (!wrong.length) setFirst(f => f + 1) } else { click(200); setWrong([...wrong, k]) }
  }
  const next = () => { const n = i + 1; setI(n); setOk(null); setWrong([]); setMsg('Kolejna historia!'); if (n >= order.length) { onEnd(stars); playVoice('safe_done') } }
  return (
    <div className="mx-auto max-w-3xl p-4 pt-14">
      <button onClick={onBack} className="rounded-full bg-white/20 px-4 py-2 text-lg">← Menu</button>
      {fin ? <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center"><Confetti /><div className="text-5xl">{'⭐'.repeat(stars)}</div>
        <div className="mt-2 text-3xl font-extrabold">Bezpieczny w sieci!</div><p className="mt-2 text-xl">Pamiętaj: <b>zawsze mów dorosłemu, któremu ufasz</b>, gdy coś w internecie Cię zaniepokoi.</p>
        <button onClick={onBack} className="mt-4 rounded-full bg-emerald-500 px-6 py-3 text-xl font-bold">OK</button></div> : <>
        <div className="mt-3"><RoboBit say={msg} voice={i === 0 && msg.startsWith('Przeczytaj') ? 'safe_intro' : undefined} /></div>
        <div className="mt-2 text-sm text-sky-300">Historia {i + 1} z {order.length}</div>
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-3xl bg-white/10 p-5">
          <div className="text-6xl">{s.icon}</div><div className="mt-1 text-2xl font-extrabold">{s.title}</div><p className="mt-2 text-xl">{s.story}</p></motion.div>
        <div className="mt-4 grid gap-3">{s.opts.map((o, k) => <motion.button key={o.t} whileTap={{ scale: .97 }} onClick={() => pick(k)}
          className={`rounded-2xl px-4 py-4 text-left text-lg font-bold shadow-lg ${ok === k ? 'bg-emerald-600' : wrong.includes(k) ? 'bg-red-500/70' : 'bg-sky-600'}`}>{o.t}</motion.button>)}</div>
        {ok !== null && <button onClick={next} className="mt-4 rounded-full bg-pink-500 px-8 py-3 text-xl font-bold">Dalej →</button>}</>}
    </div>
  )
}
