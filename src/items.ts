export type Slot = 'color' | 'hat' | 'glasses'
export interface Item { id: string; slot: Slot; name: string; price: number; req?: string; fill?: string; stroke?: string; emoji?: string }
export const ITEMS: Item[] = [
  { id: 'c_blue', slot: 'color', name: 'Niebieski', price: 0, fill: '#38bdf8', stroke: '#0369a1' },
  { id: 'c_red', slot: 'color', name: 'Czerwony', price: 5, fill: '#f87171', stroke: '#b91c1c' },
  { id: 'c_green', slot: 'color', name: 'Zielony', price: 5, fill: '#4ade80', stroke: '#15803d' },
  { id: 'c_yellow', slot: 'color', name: 'Żółty', price: 8, fill: '#fde047', stroke: '#a16207' },
  { id: 'c_purple', slot: 'color', name: 'Fioletowy', price: 8, fill: '#c084fc', stroke: '#7e22ce' },
  { id: 'c_pink', slot: 'color', name: 'Różowy', price: 8, fill: '#f9a8d4', stroke: '#be185d' },
  { id: 'c_gold', slot: 'color', name: 'Złoty', price: 25, req: 'Ekolog', fill: '#fbbf24', stroke: '#92400e' },
  { id: 'h_none', slot: 'hat', name: 'Bez czapki', price: 0 },
  { id: 'h_cap', slot: 'hat', name: 'Czapka', price: 8, emoji: '🧢' },
  { id: 'h_helm', slot: 'hat', name: 'Hełm', price: 10, emoji: '🪖' },
  { id: 'h_hat', slot: 'hat', name: 'Cylinder', price: 12, emoji: '🎩' },
  { id: 'h_grad', slot: 'hat', name: 'Czapka mistrza', price: 15, req: 'Mistrz klawiatury', emoji: '🎓' },
  { id: 'h_crown', slot: 'hat', name: 'Korona', price: 25, req: 'Młody programista', emoji: '👑' },
  { id: 'g_none', slot: 'glasses', name: 'Bez okularów', price: 0 },
  { id: 'g_sun', slot: 'glasses', name: 'Słoneczne', price: 8, emoji: '🕶️' },
  { id: 'g_glass', slot: 'glasses', name: 'Okulary', price: 6, emoji: '👓' },
  { id: 'g_gog', slot: 'glasses', name: 'Gogle', price: 12, req: 'Budowniczy komputerów', emoji: '🥽' },
]
