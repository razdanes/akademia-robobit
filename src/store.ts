import { useCallback, useEffect, useState } from 'react'
import type { Item } from './items'
export interface Quest { date: string; id: string; done: boolean }
export interface Progress { stars: number; spent: number; badges: string[]; done: string[]; owned: string[]; equipped: Record<string, string>; seconds: Record<string, number>; completed: Record<string, number>; quest: Quest | null; quests: number }
const KEY = 'robobit-progress-v1'
const init: Progress = { stars: 0, spent: 0, badges: [], done: [], owned: ['c_blue', 'h_none', 'g_none'], equipped: { color: 'c_blue', hat: 'h_none', glasses: 'g_none' }, seconds: {}, completed: {}, quest: null, quests: 0 }
export const QUEST_BONUS = 3
export const QUESTS = [
  { id: 'q_color', mod: 'coloring', text: 'Pokoloruj dziś jeden obrazek' }, { id: 'q_paint', mod: 'paint', text: 'Narysuj coś w Paint Junior' },
  { id: 'q_pc', mod: 'pc', text: 'Zbuduj komputer krok po kroku' }, { id: 'q_keys', mod: 'keys', text: 'Zagraj w grę klawiaturową' },
  { id: 'q_db', mod: 'db', text: 'Dokończ zadania w bazie danych' }, { id: 'q_code', mod: 'code', text: 'Przejdź poziomy programowania robota' },
  { id: 'q_eco', mod: 'eco', text: 'Posprzątaj świat w Eko-Świecie' }, { id: 'q_math', mod: 'math', text: 'Rozwiąż zagadki Logicznego Detektywa' }, { id: 'q_safari', mod: 'safari', text: 'Poznaj nowe słowa w Słownym Safari' }, { id: 'q_safe', mod: 'safe', text: 'Przejdź historie w module Bezpieczny Internet' }, { id: 'q_office', mod: 'office', text: 'Sformatuj tekst i zrób prezentację' },
]
export const levelOf = (stars: number) => Math.floor(stars / 10) + 1
const today = () => new Date().toISOString().slice(0, 10)
export function useProgress() {
  const [p, setP] = useState<Progress>(() => { try { return { ...init, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return init } })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }, [p])
  useEffect(() => { const d = today(); setP(s => (s.quest && s.quest.date === d ? s : { ...s, quest: { date: d, id: QUESTS[Math.floor(Math.random() * QUESTS.length)].id, done: false } })) }, [])
  const award = useCallback((stars: number, badge?: string, doneId?: string) => setP(s => ({ ...s, stars: s.stars + stars,
    badges: badge && !s.badges.includes(badge) ? [...s.badges, badge] : s.badges, done: doneId && !s.done.includes(doneId) ? [...s.done, doneId] : s.done })), [])
  const complete = useCallback((mod: string) => setP(s => {
    const q = s.quest, hit = q && !q.done && QUESTS.find(x => x.id === q.id)?.mod === mod
    return { ...s, completed: { ...s.completed, [mod]: (s.completed[mod] || 0) + 1 }, stars: s.stars + (hit ? QUEST_BONUS : 0), quest: hit ? { ...q!, done: true } : q, quests: s.quests + (hit ? 1 : 0) }
  }), [])
  const tick = useCallback((mod: string) => setP(s => ({ ...s, seconds: { ...s.seconds, [mod]: (s.seconds[mod] || 0) + 1 } })), [])
  const buy = useCallback((it: Item) => setP(s => (s.owned.includes(it.id) || s.stars - s.spent < it.price ? s : { ...s, spent: s.spent + it.price, owned: [...s.owned, it.id], equipped: { ...s.equipped, [it.slot]: it.id } })), [])
  const equip = useCallback((it: Item) => setP(s => (s.owned.includes(it.id) ? { ...s, equipped: { ...s.equipped, [it.slot]: it.id } } : s)), [])
  const reset = useCallback(() => setP({ ...init, quest: null }), [])
  return { p, award, complete, tick, buy, equip, reset }
}
