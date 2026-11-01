# Akademia RoboBit → platforma LMS: architektura

## 1. Architektura wysokopoziomowa
| Warstwa | Rekomendacja | Uzasadnienie |
|---|---|---|
| Aplikacja ucznia | Obecny React + Vite jako **PWA** (service worker, IndexedDB) | Działa offline; dziecko nie potrzebuje e-maila, loguje się kodem klasy, pseudonimem i PIN-em. |
| Panel nauczyciela / admina | **Next.js (App Router) + Tailwind + Recharts**, osobna aplikacja w monorepo (pnpm + Turborepo) | SSR i trasy API w jednym miejscu; wspólne pakiety `ui`, `content`, `progress-sdk`. |
| Backend | Route handlers Next.js na start, potem wydzielone **Fastify/NestJS** dla ingestii zdarzeń i raportów | Prosty start, możliwość skalowania ingestii niezależnie. |
| Baza | **PostgreSQL** (region UE, np. Frankfurt lub Warszawa) + **Row Level Security** per szkoła | Multi-tenancy wymuszone przez bazę, nie tylko kod. Schemat: `lms/schema.sql`. |
| Zadania w tle | pg-boss / BullMQ | Raporty PDF, dyplomy, agregacje postępów, retencja danych. |
| Pliki | Magazyn obiektów w UE (S3-kompatybilny) | Wygenerowane PDF-y, wygasające linki. |
| Logowanie dorosłych | Auth.js + Google/Microsoft SSO (konta szkolne) | Nauczyciele już mają te konta. |
| Płatności | Stripe (karty, BLIK, Przelewy24) + faktury dla szkół | Subskrypcje rodziców i licencje szkolne. |

**Synchronizacja offline.** Aplikacja zapisuje „podejścia” (moduł, czas, wynik, błędy) lokalnie z unikalnym `client_event_id` i wysyła je partiami do `POST /api/events`, gdy wróci internet. Serwer jest idempotentny (unikalny `client_event_id`). W projekcie jest już `src/telemetry.ts` (kolejka lokalna, wysyłka do `VITE_API_URL`) oraz `public/sw.js` z manifestem.

**Adaptacyjna ścieżka (AI).** Dwie warstwy:
1. **Silnik reguł na urządzeniu** (deterministyczny, offline, bez danych osobowych): np. >90% poprawnych w trybie „Litery” → proponuje „Słowa”; kilka pomyłek w „Budujemy komputer” → prostszy wariant z mniejszą liczbą części. Można rozwinąć do prostego modelu opanowania umiejętności (np. Bayesian Knowledge Tracing) zapisywanego w `student_progress.mastery`.
2. **Claude API po stronie serwera**, tylko dla nauczyciela: podsumowania klasy w języku naturalnym, propozycje zadań różnicujących, szkice komentarzy do raportów. Wejście: zagregowane, **zanonimizowane** metryki (bez pseudonimów i danych szkoły). Treści widoczne dla dzieci generuj z wyprzedzeniem, sprawdzaj przez człowieka i dodawaj do katalogu modułów, zamiast generować je na żywo. Przed wdrożeniem sprawdź aktualne zasady Anthropic dla produktów skierowanych do nieletnich.

## 2. Schemat bazy danych
Pełny plik: `lms/schema.sql`. Kluczowe decyzje:
- **Tabela `users` zawiera tylko dorosłych** (dyrektor, nauczyciel, rodzic). Uczeń to `students` bez nazwiska i e-maila: pseudonim, awatar, PIN. Imię i nazwisko zostają w e-dzienniku szkoły; powiązanie przez opcjonalne `external_ref`.
- `tenants` → `classes` → `enrollments` ← `students`; `guardians` przechowuje zgodę rodzica (wersja, data, wycofanie).
- `modules` i `skills` to wspólny katalog treści; `assignments` to praca domowa dla klasy; `attempts` to źródło raportów (czas, wynik, błędy, trudność); `events` to surowa telemetria partycjonowana miesięcznie z retencją (np. 90 dni).
- `student_progress`, `badges`, `student_badges`, `xp_ledger` obsługują gamifikację (XP jako księga zdarzeń, poziom wyliczany).
- `data_requests`, `audit_log`, `integrations`, `subscriptions` obsługują RODO, integracje i płatności.
- **RLS:** każde zapytanie aplikacji zaczyna się od `set_config('app.tenant_id', …)`; polityka `tenant_isolation` dotyczy wszystkich tabel z `tenant_id`.

## 3. Endpointy API (REST, `/api/v1`)
| Metoda | Ścieżka | Cel |
|---|---|---|
| POST | `/auth/student` | Logowanie ucznia: kod klasy + pseudonim + PIN |
| GET/POST | `/classes` | Lista / utworzenie klasy (kod dołączenia) |
| GET/POST | `/classes/:id/students` | Uczniowie klasy; masowy import z CSV (pseudonimy) |
| POST | `/assignments` | Zadanie modułu klasie (`classId`, `moduleId`, `dueAt`, `config`) |
| GET | `/classes/:id/assignments` | Status pracy domowej (kto ukończył) |
| POST | `/events` | Idempotentna synchronizacja podejść z PWA (partie) |
| GET | `/classes/:id/stats?range=` | Dane do wykresów (czas, ukończenia, błędy) |
| GET | `/students/:id/progress` | Szczegółowy postęp ucznia |
| GET | `/classes/:id/report.pdf` | Raport klasy (job w tle, link wygasający) |
| GET | `/classes/:id/diplomas.pdf` | Dyplomy dla uczniów klasy |
| GET | `/export/oneroster/*`, `/export/classes/:id.csv` | Eksport do e-dzienników i innych systemów |
| POST/GET | `/webhooks` | Powiadomienia o ukończeniu pracy domowej |
| POST | `/data-requests` | RODO: dostęp, eksport, usunięcie danych ucznia |
| GET | `/ai/class-summary/:id` | Podsumowanie klasy (Claude, dane zagregowane, tylko nauczyciel) |

**Integracja z e-dziennikami.** Nie opieraj produktu na jednym dzienniku. Bezpieczna kolejność: (1) eksport CSV, (2) Google Classroom API, (3) LTI 1.3 (Moodle, Teams) i OneRoster, (4) formalne partnerstwo z dostawcą dziennika (np. Librus), jeśli zaproponuje oficjalne API.

## 4. Fragment kodu
`lms/TeacherDashboard.tsx` – komponent Next.js (client component), Tailwind, Recharts i SWR: filtr klasy i okresu, 4 wskaźniki (czas, ukończone moduły, błędy, uczniowie wymagający wsparcia), dwa wykresy, tabela uczniów z paskami postępu, zadawanie pracy domowej, przyciski raportu PDF i dyplomów. Instalacja: `npm i recharts swr`. Przy braku API pokazuje dane demonstracyjne.

## 5. Plan działania
1. **Faza 0 (2–3 tyg.) – fundament:** monorepo, PWA (zrobione w tej wersji), telemetria, konta nauczycieli, klasy, logowanie ucznia kodem + PIN, baza z RLS, polityka prywatności i umowa powierzenia przetwarzania (szkoła jako administrator, Ty jako podmiot przetwarzający).
2. **Faza 1 (4–6 tyg.) – wartość dla nauczyciela:** ingestia zdarzeń, panel (komponent z `lms/`), praca domowa, raport PDF i dyplomy. **To jest MVP, które można sprzedawać.**
3. **Faza 2 (4 tyg.) – pilotaż w 3–5 szkołach:** feedback, poprawki, dopracowanie treści; moduły „Bezpieczny Internet” i „Word i prezentacje” (są już w aplikacji w wersji podstawowej).
4. **Faza 3 – adaptacja i integracje:** silnik reguł, eksport CSV, Google Classroom, LTI, podsumowania Claude dla nauczyciela.
5. **Faza 4 – rodzice i przychody:** konta rodziców, zgody, subskrypcje, płatności.
6. **Faza 5 – tryb AR (pilotaż):** podejście „WebAR lite”: kamera (`getUserMedia`) + detektor obiektów działający na urządzeniu (np. MediaPipe lub TensorFlow.js COCO-SSD, który zna klasy takie jak mysz, klawiatura, laptop, telewizor). Obraz nie opuszcza urządzenia, więc nie ma problemu RODO, a rozwiązanie nie zależy od wsparcia WebXR w przeglądarce.

**RODO.** Minimalizacja (pseudonim zamiast imienia i nazwiska), hosting w UE, umowa powierzenia ze szkołą, zgody rodziców tam, gdzie wymagane, ocena skutków (DPIA), retencja telemetrii, prawa osób (`data_requests`), brak reklam i zewnętrznych trackerów, szyfrowanie, logi dostępu. Skonsultuj dokumenty z prawnikiem.

**Model biznesowy (hipotezy do zweryfikowania w pilotażu).** Darmowy plan szkoły: moduły dla uczniów, 1 klasa, podstawowy podgląd postępów. Plan nauczyciela/szkoły (płatny, roczny): wiele klas, praca domowa, analityka, raporty, dyplomy, eksporty i integracje. Subskrypcja rodzica (miesięczna): szczegółowe postępy dziecka, dodatkowe treści, sklepik. Oferta dla gmin: licencja na wiele szkół i zbiorcze raporty. Sprzedaż zaczynaj od nauczycieli (łatwy zakup, szybki efekt), a dopiero potem od dyrekcji.
