# Pool Party Personality

A mobile-first party game for a university house party. Guests scan a QR code, fill in a short profile, pick what they're down for (🏊 swimming, 🏓 ping pong, 🎱 pool, 🎲 board games), answer **exactly 14 slider questions** about fries, robots, Irish exits and questionable money decisions, and get an automatically assigned **party type** (Ghost, Life of the Party, Chameleon, Drinking Machine, Game Goblin, Side Quest, Observer, Kitchen NPC). Then they can see who they align with, who they'd fight over the aux with, and who else wants to play ping pong right now.

Everything is a private directory for guests only: `noindex`, `robots.txt` disallow, and every data endpoint requires a participant cookie.

## Stack

- Next.js 16 (App Router, Route Handlers), TypeScript, Tailwind 4, a few shadcn/ui primitives
- Storage: **Supabase Postgres** when configured, otherwise a zero-dependency **JSON file store** (`.data/party.json`) for local dev
- No image assets: avatars are inline SVG, confetti and animations are CSS
- Vitest for the scoring / compatibility logic

## Run it locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD
npm run dev                  # http://localhost:4817
```

Out of the box the file store is used and 12 fake guests are seeded (see `src/lib/seed.ts`), so People / Activities / Opinions have data immediately.

Other scripts: `npm test` (unit tests), `npm run lint`, `npm run typecheck`, `npm run build && npm start`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Enables `/admin` (organizer page). Required for delete / reset / CSV export / seed management. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Use Supabase Postgres. Run `supabase/schema.sql` in the SQL editor first. The service-role key is only ever used server-side; RLS stays on with no anon policies. |
| `SEED_DATA` | `true`/`false`. Defaults to `true` outside production. Controls automatic seeding of an empty **file** store. Seed guests can also be loaded / removed from `/admin` on any store. |
| `DATA_FILE` | Override the JSON file path for the file store. |

### Before the real party

1. Create a Supabase project, run `supabase/schema.sql`, set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
2. Set `ADMIN_PASSWORD`.
3. Set `SEED_DATA=false` (or open `/admin` → "Remove all seed guests").
4. Deploy to Vercel and print a QR code pointing at the root URL.

Without Supabase on Vercel the app still runs, but data lives in `/tmp` and is ephemeral — fine for a demo, not for the party.

## How it works

- **Flow**: `/` welcome → `/join` profile (CMU program field appears when either university is CMU) → `/join/activities` → `/quiz` (14 sliders) → `/reveal` → tabs `/me`, `/people`, `/activities`, `/opinions`.
- **Session**: a random token is stored in an httpOnly cookie; only its SHA-256 hash is stored server-side. Refreshing keeps the session. The quiz cannot be retaken unless the organizer resets it from `/admin`.
- **Quiz**: slider movement is purely local. The draft is saved to `localStorage` on release/advance; all 14 answers are sent in one `POST /api/me/answers` at the end, where the avatar is computed and stored.
- **Money sliders** (`assistant_pay`, `assistant_salary`, `phone_price`) map the 0–100 position onto nonlinear dollar stops; the stored `display_value` is the dollar string, and compatibility always compares normalized positions.
- **Avatars** (`src/lib/avatars.ts`): 14 answers → lightweight dimensions (`src/lib/dimensions.ts`) → weighted score per avatar → highest wins with a fixed tie-break order. No randomness; identical answers always produce the same type.
- **Compatibility** (`src/lib/compatibility.ts`): mean of `1 − |a − b| / 100` across all 14 questions. Also derives closest takes, biggest disagreements, money gaps and templated conversation starters.
- **Data loading**: one `GET /api/party` returns the viewer plus every guest (answers + activities). Compatibility for every card is computed once per refresh in a memoized map on the device; the tabs layout also server-renders the initial payload so there's no loading flash. Activity toggles are optimistic.

## Project layout

```
src/lib/questions.ts        the 14 questions: labels, live captions, party captions, templates
src/lib/money.ts            nonlinear money slider mapping + formatting
src/lib/dimensions.ts       party dimensions from answers
src/lib/avatars.ts          avatar metadata + deterministic assignment
src/lib/compatibility.ts    pairwise comparison + conversation starters
src/lib/stats.ts            party-wide aggregates (Opinions / admin)
src/lib/seed.ts             fake guests covering every avatar
src/lib/store/              Store interface, FileStore, SupabaseStore
src/app/api/                route handlers (participants, me, party, admin)
src/app/(tabs)/             Me / People / Activities / Opinions with bottom nav
src/components/             slider, avatar SVGs, cards, party data provider
supabase/schema.sql         Postgres schema
```
