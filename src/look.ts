import { useSyncExternalStore } from 'react'
let eq: Record<string, string> = {}
const subs = new Set<() => void>()
export const setLook = (e: Record<string, string>) => { eq = e; subs.forEach(f => f()) }
export const useLook = () => useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb) } }, () => eq)
