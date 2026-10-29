// Building blocks for printable-style line art. Shapes are white-filled, so later shapes hide earlier lines.
const r = Math.round
export const E = (x: number, y: number, rx: number, ry: number, rot = 0, ex = '') => `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(rx)}" ry="${r(ry)}" transform="rotate(${rot} ${r(x)} ${r(y)})" ${ex}/>`
export const C = (x: number, y: number, rad: number, ex = '') => E(x, y, rad, rad, 0, ex)
export const R = (x: number, y: number, w: number, h: number, rad = 0, ex = '') => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rad}" ${ex}/>`
export const P = (pts: string, ex = '') => `<polygon points="${pts}" ${ex}/>`
export const F = (d: string, ex = '') => `<path d="${d}" ${ex}/>`
export const L = (d: string) => F(d, 'fill="none"')
export const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join('')
/** Union of shapes: hides inner overlapping outlines. */
export const U = (...a: string[]) => { const s = a.join(''); return s + s.replace(/<(ellipse|rect|polygon|path) /g, '<$1 stroke="none" ') }
export const dot = (x: number, y: number, rad = 5) => C(x, y, rad, 'fill="#222"')
export const eye = (x: number, y: number, rad = 14) => C(x, y, rad) + dot(x + 2, y + 1, rad / 2) + C(x - rad / 4, y - rad / 3, rad / 6, 'fill="#fff" stroke="none"')
export const star = (x: number, y: number, rad: number, pts = 5, k = .45) => P(rep(pts * 2, i => { const a = Math.PI * i / pts - Math.PI / 2, q = i % 2 ? rad * k : rad; return `${r(x + q * Math.cos(a))},${r(y + q * Math.sin(a))} ` }))
export const gear = (x: number, y: number, rad: number, t = 8) => P(rep(t * 4, i => { const a = 2 * Math.PI * i / (t * 4), q = i % 4 < 2 ? rad : rad * .78; return `${r(x + q * Math.cos(a))},${r(y + q * Math.sin(a))} ` })) + C(x, y, rad * .35)
export const sun = (x: number, y: number, rad: number) => star(x, y, rad * 1.8, 12, .6) + C(x, y, rad) + L(`M${x - rad / 2},${y + rad / 4} Q${x},${y + rad / 1.5} ${x + rad / 2},${y + rad / 4}`) + dot(x - rad / 3, y - rad / 5, 3) + dot(x + rad / 3, y - rad / 5, 3)
export const cloud = (x: number, y: number, s = 1) => F(`M${x - 55 * s},${y + 20 * s} A${22 * s},${22 * s} 0 0 1 ${x - 45 * s},${y - 20 * s} A${30 * s},${30 * s} 0 0 1 ${x + 10 * s},${y - 30 * s} A${26 * s},${26 * s} 0 0 1 ${x + 50 * s},${y - 5 * s} A${18 * s},${18 * s} 0 0 1 ${x + 45 * s},${y + 20 * s} Z`)
export const tree = (x: number, y: number, s = 1) => R(x - 8 * s, y - 55 * s, 16 * s, 55 * s) + U(C(x, y - 90 * s, 40 * s), C(x - 30 * s, y - 62 * s, 28 * s), C(x + 30 * s, y - 62 * s, 28 * s))
export const pine = (x: number, y: number, s = 1) => R(x - 6 * s, y - 20 * s, 12 * s, 20 * s) + P(`${x - 40 * s},${y - 15 * s} ${x},${y - 75 * s} ${x + 40 * s},${y - 15 * s}`) + P(`${x - 32 * s},${y - 55 * s} ${x},${y - 105 * s} ${x + 32 * s},${y - 55 * s}`)
export const flower = (x: number, y: number, s = 1) => L(`M${x},${y} Q${x + 12 * s},${y + 35 * s} ${x},${y + 70 * s}`) + F(`M${x},${y + 45 * s} Q${x + 30 * s},${y + 25 * s} ${x + 34 * s},${y + 45 * s} Q${x + 15 * s},${y + 58 * s} ${x},${y + 45 * s} Z`) +
  U(...[0, 1, 2, 3, 4, 5].map(i => E(x + 17 * s * Math.cos(i * Math.PI / 3), y + 17 * s * Math.sin(i * Math.PI / 3), 11 * s, 17 * s, i * 60 + 90))) + C(x, y, 9 * s)
export const hill = () => F('M14,372 Q150,335 300,365 T586,355 L586,424 L14,424 Z')
export const frame = () => R(12, 12, 576, 426, 26, 'fill="none"')
export const sky = () => sun(520, 85, 28) + cloud(130, 85) + cloud(350, 65, .8)
