import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RoboBit from './components/RoboBit'
import Backdrop from './components/Backdrop'
import Intro from './components/Intro'
import ColoringBook from './features/ColoringBook'
import PaintJunior from './features/PaintJunior'
import PcBuilder from './features/PcBuilder'
import KeyboardGame from './features/KeyboardGame'
import DbGame from './features/DbGame'
import CodeGame from './features/CodeGame'
import EcoWorld from './features/EcoWorld'
import DetectiveGame from './features/DetectiveGame'
import SafariGame from './features/SafariGame'
import SafetyGame from './features/SafetyGame'
import OfficeGame from './features/OfficeGame'
import { endAttempt, markCompleted, startAttempt } from './telemetry'
import Workshop from './features/Workshop'
import Dashboard from './features/Dashboard'
import { QUESTS, QUEST_BONUS, levelOf, useProgress } from './store'
import { setLook } from './look'
import { STORY, PARTS } from './story'
import { click } from './audio'
import { isMuted, setMusic, toggleMute } from './music'
import { playVoice, playVoiceIfFile } from './voice'

type Screen = 'menu' | 'coloring' | 'pc' | 'keys' | 'paint' | 'db' | 'code' | 'eco' | 'math' | 'safari' | 'safe' | 'office' | 'shop' | 'dash'
interface Tile { id: Exclude<Screen, 'menu' | 'dash'>; label: string; sub: string; icon: string; color: string; voice?: string }
const TILES: Tile[] = [
  { id: 'coloring', label: 'Kolorowanki', sub: 'Pokoloruj i zdobądź gwiazdki', icon: '🎨', color: 'from-pink-500 to-orange-400' },
  { id: 'pc', label: 'Budujemy komputer', sub: 'Poznaj części krok po kroku', icon: '🖥️', color: 'from-sky-500 to-indigo-500', voice: 'pc_intro' },
  { id: 'keys', label: 'Poznaj klawiaturę', sub: 'Pisz szybko jak mistrz', icon: '⌨️', color: 'from-emerald-500 to-teal-400', voice: 'kb_pick' },
  { id: 'db', label: 'Baza danych', sub: 'Tabele, wiersze i rekordy', icon: '🗃️', color: 'from-amber-500 to-red-500', voice: 'db_intro' },
  { id: 'code', label: 'Programuj robota', sub: 'Twoje pierwsze programy', icon: '🤖', color: 'from-cyan-500 to-blue-600', voice: 'code_tip_1' },
  { id: 'eco', label: 'Eko-Świat', sub: 'Segreguj śmieci, poznaj zwierzęta', icon: '🌍', color: 'from-lime-500 to-green-600', voice: 'eco_intro' },
  { id: 'math', label: 'Logiczny Detektyw', sub: 'Liczby, figury i rozkazy', icon: '🕵️', color: 'from-fuchsia-500 to-purple-600', voice: 'math_intro' },
  { id: 'safari', label: 'Słowne Safari', sub: 'Słowa po polsku i angielsku', icon: '🦁', color: 'from-orange-500 to-rose-500', voice: 'safari_intro' },
  { id: 'safe', label: 'Bezpieczny Internet', sub: 'Co robić w sieci? Ćwicz na historiach', icon: '🛡️', color: 'from-teal-500 to-cyan-600', voice: 'safe_intro' },
  { id: 'office', label: 'Word i prezentacje', sub: 'Formatuj tekst i zrób slajdy', icon: '📝', color: 'from-blue-500 to-indigo-600', voice: 'office_intro' },
  { id: 'paint', label: 'Paint Junior', sub: 'Rysuj, stempluj, twórz', icon: '🖌️', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'shop', label: 'Domek RoboBita', sub: 'Wydaj gwiazdki na nowy wygląd', icon: '🏠', color: 'from-yellow-400 to-orange-500', voice: 'shop_hello' },
]
export default function App() {
  const [screen, setScreen] = useState<Screen>('menu'), [intro, setIntro] = useState(true), [launch, setLaunch] = useState<Tile | null>(null)
  const { p, award, complete, tick, buy, equip, reset } = useProgress()
  const [mute, setMute] = useState(isMuted())
  useEffect(() => { setMusic(screen === 'menu' || screen === 'dash' ? 'menu' : ['coloring', 'paint', 'shop', 'safari'].includes(screen) ? 'color' : 'game') }, [screen])
  useEffect(() => { setLook(p.equipped) }, [p.equipped])
  useEffect(() => { const t = setInterval(() => { if (!intro && screen !== 'menu' && screen !== 'dash' && !document.hidden) tick(screen) }, 1000); return () => clearInterval(t) }, [screen, intro, tick])
  useEffect(() => { endAttempt(); if (screen !== 'menu' && screen !== 'dash') startAttempt(screen) }, [screen])
  const finish = (mod: string) => { complete(mod); markCompleted() }
  const go = (t: Tile) => {
    if (launch) return
    click(660); setLaunch(t)
    setTimeout(() => setScreen(t.id), 650)
    setTimeout(() => { setLaunch(null); if (t.voice) playVoiceIfFile(t.voice) }, 1350)
  }
  const back = () => { click(440); setScreen('menu') }
  const aw = (mod: string, badge: string) => (s: number) => { award(s, badge); finish(mod) }
  const lvl = levelOf(p.stars), xp = p.stars % 10
  const parts = Math.min(PARTS.length, p.badges.length + p.quests)
  const quest = p.quest && QUESTS.find(q => q.id === p.quest!.id), qTile = quest && TILES.find(t => t.id === quest.mod)

  const rec = TILES.filter(t => !['shop', 'paint', 'coloring'].includes(t.id)).sort((a, b) => (p.completed[a.id] || 0) - (p.completed[b.id] || 0))[0]
  let view
  if (screen === 'coloring') view = <ColoringBook done={p.done} onBack={back} onDone={(s, id) => { award(s, 'Kolorowanki: pierwszy obrazek', id); finish('coloring') }} />
  else if (screen === 'paint') view = <PaintJunior onBack={back} onDone={aw('paint', 'Mały artysta')} />
  else if (screen === 'pc') view = <PcBuilder onBack={back} onWin={aw('pc', 'Budowniczy komputerów')} />
  else if (screen === 'db') view = <DbGame onBack={back} onEnd={aw('db', 'Mistrz baz danych')} />
  else if (screen === 'code') view = <CodeGame onBack={back} onEnd={aw('code', 'Młody programista')} />
  else if (screen === 'keys') view = <KeyboardGame onBack={back} onEnd={aw('keys', 'Mistrz klawiatury')} />
  else if (screen === 'eco') view = <EcoWorld onBack={back} onEnd={aw('eco', 'Ekolog')} />
  else if (screen === 'math') view = <DetectiveGame onBack={back} onEnd={aw('math', 'Detektyw')} />
  else if (screen === 'safari') view = <SafariGame onBack={back} onEnd={aw('safari', 'Podróżnik słów')} />
  else if (screen === 'safe') view = <SafetyGame onBack={back} onEnd={aw('safe', 'Bezpieczny w sieci')} />
  else if (screen === 'office') view = <OfficeGame onBack={back} onEnd={aw('office', 'Mistrz biura')} />
  else if (screen === 'shop') view = <Workshop p={p} onBuy={buy} onEquip={equip} onBack={back} />
  else if (screen === 'dash') view = <Dashboard p={p} onBack={back} onReset={reset} />
  else view = (
    <div className="mx-auto max-w-5xl p-4 pt-14">
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.h1 className="bg-gradient-to-r from-sky-300 via-fuchsia-300 to-yellow-200 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl" animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 3 }}>Akademia RoboBit</motion.h1>
        <RoboBit size={120} say="Cześć! Jestem RoboBit. Wybierz zabawę!" voice="menu_hello" />
      </div>
      <div className="mx-auto mt-5 flex max-w-xl items-center gap-4 rounded-3xl bg-white/10 p-4 backdrop-blur">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-slate-900"><span className="text-xs font-bold">POZIOM</span><span className="text-2xl font-extrabold leading-none">{lvl}</span></div>
        <div className="flex-1">
          <div className="flex justify-between text-sm font-bold"><span>⭐ {p.stars - p.spent} do wydania</span><span>jeszcze {10 - xp} do poziomu {lvl + 1}</span></div>
          <div className="mt-1 h-4 overflow-hidden rounded-full bg-black/30"><motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-yellow-300" initial={{ width: 0 }} animate={{ width: `${xp * 10}%` }} transition={{ duration: 1 }} /></div>
        </div>
      </div>
      {rec && <div className="mx-auto mt-3 flex max-w-xl items-center justify-between gap-3 rounded-3xl bg-teal-500/20 p-3 backdrop-blur"><span>🧭 Polecamy dziś: <b>{rec.label}</b></span><button onClick={() => go(rec)} className="rounded-full bg-teal-300 px-4 py-2 font-bold text-slate-900">Zagraj</button></div>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-indigo-500/25 p-4 backdrop-blur">
          <div className="flex items-center justify-between"><b className="text-sky-200">🚀 Naprawiamy statek RoboBita</b><button onClick={() => playVoice(`story_${parts}`, STORY[parts])} aria-label="Posłuchaj" className="h-10 w-10 rounded-full bg-white/20">🔊</button></div>
          <p className="mt-1 text-lg">{STORY[parts]}</p>
          <div className="mt-2 flex gap-2 text-3xl">{PARTS.map(([n, ic], i) => <span key={n} title={n} className={i < parts ? '' : 'opacity-30 grayscale'}>{i < parts ? ic : '❔'}</span>)}</div>
        </div>
        {quest && qTile && <div className="rounded-3xl bg-amber-500/25 p-4 backdrop-blur"><b className="text-yellow-200">🎯 Zadanie dnia</b>
          <p className="mt-1 text-lg">{quest.text}</p>
          {p.quest!.done ? <div className="mt-2 font-bold text-emerald-300">✅ Wykonane! Dostajesz +{QUEST_BONUS} ⭐ i część statku</div>
            : <button onClick={() => go(qTile)} className="mt-2 rounded-full bg-yellow-300 px-5 py-2 text-lg font-bold text-slate-900">{qTile.icon} Zagraj (+{QUEST_BONUS} ⭐)</button>}</div>}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t, i) => (
          <motion.button key={t.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .06 * i }} whileHover={{ scale: 1.05, rotate: -1 }} whileTap={{ scale: .95 }} onClick={() => go(t)}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.color} p-5 text-left shadow-xl ring-2 ring-white/20`}>
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <motion.div className="text-6xl" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: i * .3 }}>{t.icon}</motion.div>
            <div className="mt-2 text-xl font-extrabold">{t.label}</div><div className="text-sm text-white/85">{t.sub}</div>
          </motion.button>))}
      </div>
      {p.badges.length > 0 && <div className="mt-6 text-center"><div className="mb-2 font-bold text-sky-200">Twoje odznaki</div>
        <div className="flex flex-wrap justify-center gap-2">{p.badges.map(b => <motion.span key={b} initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-yellow-300 px-3 py-1 font-bold text-slate-900">🏅 {b}</motion.span>)}</div></div>}
      <div className="mt-8 text-center"><button onClick={() => { click(); setScreen('dash') }} className="rounded-full bg-white/10 px-5 py-2 text-slate-300">👨‍🏫 Panel rodzica i nauczyciela</button></div>
    </div>)
  return <>
    <Backdrop />
    <AnimatePresence>{intro && <Intro key="intro" onStart={() => { setIntro(false); playVoice('menu_hello') }} />}</AnimatePresence>
    <button onClick={() => setMute(toggleMute())} aria-label="Dźwięk" className="fixed right-3 top-3 z-40 h-12 w-12 rounded-full bg-white/20 text-2xl backdrop-blur">{mute ? '🔇' : '🔊'}</button>
    <AnimatePresence mode="wait"><motion.div key={screen} initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .98 }}>{view}</motion.div></AnimatePresence>
    <AnimatePresence>{launch && <motion.div key="launch" className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br ${launch.color}`}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(150% at 50% 50%)' }} exit={{ opacity: 0 }} transition={{ duration: .45 }}>
      <motion.div className="text-9xl" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: .1 }}>{launch.icon}</motion.div>
      <motion.div className="mt-4 text-4xl font-extrabold" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .3 }}>{launch.label}</motion.div>
      <div className="mt-6 flex gap-2">{[0, 1, 2].map(i => <motion.span key={i} className="h-4 w-4 rounded-full bg-white" animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: .6, delay: i * .15 }} />)}</div>
    </motion.div>}</AnimatePresence>
  </>
}
