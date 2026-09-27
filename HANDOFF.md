# Handoff: Pool Party Personality

Snapshot of the project state for the next agent. Read `README.md` for the product/architecture overview; this file covers **what is done, what was verified, what is unverified, and what to do next**.

## Status at a glance

| Area | State |
| --- | --- |
| Typecheck (`npm run typecheck`) | passing |
| Lint (`npm run lint`) | passing, 0 warnings |
| Unit tests (`npm test`, vitest, 18 tests) | passing |
| Production build (`npm run build`) | passing (verified on a copy of the tree; all routes dynamic except `/robots.txt`, `/icon.svg`, `/_not-found`) |
| Dev server | `npm run dev` on port **4817** |
| Git | all work on `main`; last two small edits are in the final handoff commit (see below) |

Everything in the original spec's P0 and P1 lists is implemented. P2 items (university autocomplete via `<datalist>`, activity filter chips on People, CSV export) are also present in basic form.

## What was built (P0 + P1 complete)

- Flow: `/` welcome → `/join` (profile, consent checkbox, CMU-conditional program field) → `/join/activities` (4 large tiles with live counts) → `/quiz` (exactly 14 native-range sliders, live captions/emoji/hue, money sliders show dollar amounts, draft in `localStorage`, single batched `POST /api/me/answers`) → `/reveal` (0.9 s avatar shuffle → pop + CSS confetti + 3 observations) → tabs `/me`, `/people`, `/people/[id]`, `/activities`, `/activities/[id]`, `/opinions`, plus `/me/edit`.
- Bottom nav is sticky (`src/components/bottom-nav.tsx`); tabs layout server-renders the initial party payload into `PartyProvider` (`src/components/party-provider.tsx`), which refreshes on focus / every 45 s and applies optimistic activity updates.
- Domain logic lives in `src/lib/` and is fully unit-tested: `questions.ts` (14 questions, 5 live captions + 5 party captions + moods + observations + conversation templates each), `money.ts` (piecewise-linear nonlinear stops, `$100,000+/year` at the top), `dimensions.ts`, `avatars.ts` (weighted, deterministic, fixed tie-break order; seed guests cover all 8 types), `compatibility.ts` (mean of `1-|a-b|/100`, closest/disagreements/money gaps/starters), `stats.ts` (medians, histograms, divisive/consensus/money-gap, species distribution + blurbs).
- Storage: `Store` interface with `FileStore` (`.data/party.json`, atomic writes, auto-seeds when empty and `SEED_DATA` isn't `false`) and `SupabaseStore` (`@supabase/supabase-js`, schema in `supabase/schema.sql`). Selection in `src/lib/store/index.ts` by presence of `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Auth: random token in httpOnly cookie `pp_token`, SHA-256 hash stored. Admin: `ADMIN_PASSWORD` env + HMAC cookie `pp_admin` (12 h). `.env.local` currently has `ADMIN_PASSWORD=party-organizer` (not committed; `.env*` is gitignored).
- Admin `/admin`: counts, avatar distribution, activity counts, participant table (delete, reset quiz), slider distributions, CSV export, load/remove seed guests.
- Privacy: `robots` metadata noindex, `robots.txt` disallow, `X-Robots-Tag` header (in `next.config.ts`), all data endpoints require the participant cookie.
- Avatars are inline SVG (`src/components/avatar-art.tsx`); no image assets. Client JS is small (~170 KB gzip total incl. framework).

## Verified so far

- curl smoke test of the whole API flow (create → activities → answers → party → all pages return 200).
- A computer-use QA pass at a 375 px viewport confirmed: welcome, profile form (CMU field appears, consent error), activity tiles, all 14 sliders with changing captions, money slider showing `$100,000+/year` at the far right, back/forward, reveal (got "The Ghost"), `/me` (most aligned/different tiles, disagreement + money gap cards, activity matches, top matches), and opening a comparison page. Screenshots: `/tmp/party-shots/01–05*.webp` (ephemeral to this VM).
- Avatar distribution sanity-checked with a Monte Carlo script (roughly balanced across regimes; Chameleon dominates only for very neutral answer sets, Side Quest only for very erratic ones).

## Not yet verified (next agent: start here)

1. **Second QA pass aborted partway** (the computer-use agent hit an image limit). Before it died it confirmed at 375 px: `/people/[id]` opened from `/me`, `/people` sort tabs + Ping Pong filter chip (screenshot `/tmp/party-shots2/02-people-page-filters.webp`: Name sort alphabetical, only ping-pong people listed, cards render cleanly), and the `/activities` Swimming toggle round-tripped a `PUT /api/me/activities 200`. **Still not eyeballed:** the `/people/[id]` page body (two-marker sliders, contact cards, "All 14 answers" collapsible), `/activities/[id]` toggle button, `/opinions` histograms/markers, refresh persistence, `/admin` dashboard. All return 200 and rendered fine in curl. If you rerun QA with a computer-use agent, start a fresh agent and tell it to take very few screenshots.
2. **SupabaseStore has never run against a real Supabase project** (no credentials in this environment). It is written carefully against `supabase/schema.sql`, but expect to smoke-test `createParticipant`, `saveAnswers` (upsert on `participant_id,question_id`), `setActivities`, `resetQuiz`, `deleteSeedParticipants` once `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` exist.
3. Slow-network / Lighthouse mobile run not done.
4. No real-device touch test (only Chrome device emulation).

## Uncommitted-at-pause edits (now included in the handoff commit)

- `next.config.ts`: added `allowedDevOrigins` (dev HMR from 127.0.0.1 / LAN), `poweredByHeader: false`, and `X-Robots-Tag` / `nosniff` / `Referrer-Policy` headers.
- `src/app/quiz/quiz.tsx`: slider block changed from `mt-auto pt-6` to `my-auto pt-8 pb-2` so it's vertically centered in the free space instead of leaving a large gap under the question on tall phones. Not visually re-checked yet.

## Known small things / ideas

- On `/activities`, tapping a tile toggles your own participation; the separate "Who's in →" pill opens the people list. Spec said "tapping an activity shows participants" — decide whether the whole tile should instead navigate and use a smaller toggle.
- `GET /api/party` returns every guest with all answers (~1.5 KB/guest). Fine for a house party; trim if the guest list grows into the hundreds.
- `SEED_DATA` default is `true` outside production; on Vercel production the file store falls back to `/tmp` (ephemeral) with a console warning. Real party needs Supabase.
- Cookie `secure` flag is only set in production, so testing a production build over plain `http://<lan-ip>` will not keep the session; use HTTPS or dev mode for LAN testing.
- Dev-only Next.js "N" indicator overlaps the bottom-left of the CTA in dev screenshots; not present in production.

## Environment notes

- Node 22, npm. `npm install` then `npm run dev`. A tmux session named `party-dev` was running the dev server on this VM; log at `/tmp/party-dev.log`.
- `@types/node` pinned to `^22` to satisfy vitest 5 peer deps.
- `vitest.config.mts` (ESM) aliases `@` → `src`.
