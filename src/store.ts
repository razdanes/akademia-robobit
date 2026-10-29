import { useCallback, useEffect, useState } from 'react'
export interface Progress { stars: number; badges: string[]; done: string[] }
const KEY = 'robobit-progress-v1'
const init: Progress = { stars: 0, badges: [], done: [] }
export const levelOf = (stars: number) => Math.floor(stars / 10) + 1
export function useProgress() {
  const [p, setP] = useState<Progress>(() => { try { return { ...init, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return init } })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }, [p])
  const award = useCallback((stars: number, badge?: string, doneId?: string) =>
    setP(s => ({ stars: s.stars + stars,
      badges: badge && !s.badges.includes(badge) ? [...s.badges, badge] : s.badges,
      done: doneId && !s.done.includes(doneId) ? [...s.done, doneId] : s.done })), [])
  return { p, award }
}
