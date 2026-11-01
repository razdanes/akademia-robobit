# Regeneruje lista-nagran.md/csv z src/voiceLines.json i plików w public/voice. Uruchom: python nagrania/gen_lista.py
import json, csv, os
L = json.load(open('src/voiceLines.json', encoding='utf-8'))
have = {f[:-4] for f in os.listdir('public/voice') if f.endswith('.mp3')}
with open('nagrania/lista-nagran.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['plik', 'kwestia', 'status'])
    for l in L: w.writerow([l['id'] + '.mp3', l['text'], 'GOTOWE' if l['id'] in have else 'do nagrania'])
md = ['# Akademia RoboBit – lista nagrań głosu RoboBita', f'Razem plików: **{len(L)}**, nagrane: **{sum(l["id"] in have for l in L)}**.', '',
 'MP3, mono, 48 kHz, ok. 128 kbps. Nazwa pliku jak w tabeli, folder `public/voice/`. Litery czytaj jako nazwy liter (a, be, ce…).', '']
sc = None
for l in L:
    if l['scene'] != sc: sc = l['scene']; md += ['', f'## {sc}', '', '| Plik | Kwestia | Status |', '|---|---|---|']
    md.append(f"| `{l['id']}.mp3` | {l['text']} | {'✅' if l['id'] in have else '⬜'} |")
open('nagrania/lista-nagran.md', 'w', encoding='utf-8').write('\n'.join(md) + '\n')
