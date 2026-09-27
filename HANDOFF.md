# Handoff: Pool Party Personality

Snapshot of the project state for the next agent. Read `README.md` for the product/architecture overview; this file covers **what is done, what was verified, what is unverified, and what to do next**.

## Grocery guessing bonus (September 27, 2026)

- Added a final dollar-input bonus step after the 16 personality questions, with reward for closest guess and playful forfeit for furthest. Draft persistence, Back, review/edit and final submission include it. API validates $0–$100,000 with up to two decimals.
- Stored under `grocery_cost_guess` in the existing answers collection/table, outside personality `QuestionId`. Exact amount is in `display`; normalized value is amount/100000*100 solely to fit the existing storage range. No migration required. Scoring, observations, comparisons and stats still iterate only the 16 personality questions.
- Other guests' payloads omit bonus guesses; owner/admin retain them. Admin participant list and CSV expose guesses to organizers for manual judging. Quiz reset clears the guess too; legacy submissions remain unchanged.
- 62 tests and lint pass. Typecheck currently fails on separate user host edits: page references lowercase `HOSTS.sunny`/`HOSTS.muyang` while configuration keys are `Sunny`/`Muyang`. These unrelated edits were left untouched.

## Optional food/supplies (September 27, 2026)

- Join and edit-profile forms now offer an optional checkbox revealing a 500-character food/supplies note, with explicit reassurance that bringing anything is not necessary. Unchecking and saving clears it.
- `broughtItems` is persisted in both stores, visible only to owner/organizers, displayed in admin, and exported as `brought_items`. Older profiles default to no note.
- Existing Supabase databases need `supabase/migrations/20260927_brought_items.sql`; migration was not applied remotely. Full schema includes the column for fresh installs.

## Contact retention and usage guide (September 27, 2026)

- README now starts with attendee and organizer guides, database setup, in-party operations, post-party CSV/database access, a contacts-only SQL query, and storage/privacy caveats.
- Existing signup already persists names/email/phone before quiz completion. Supabase configuration is not present in this workspace; no remote database was provisioned or connected. The organizer must supply their own project URL and server service-role key as documented.
- Storage now fails closed on incomplete Supabase credentials, on Vercel without Supabase, or when `REQUIRE_DATABASE=true` without Supabase. The older ephemeral Vercel fallback notes below no longer apply. Local development still uses persistent-on-disk JSON by default.
- Admin export button is labeled “Export contacts & answers”; CSV includes contact visibility and retains organizer-only contacts. Added export authorization/unfinished-profile coverage and database-configuration tests.

## Two additional questions (September 27, 2026)

- Appended `history_sharing` (YouTube watch history vs. ChatGPT query history comfort) and `song_lyrics` (improvised words vs. every lyric), both continuous sliders. No actual history is collected.
- Quiz now has 16 questions (15 sliders and the existing destination choice). UI counts derive from the question list. Seeds, captions, observations, comparisons and stats include the additions; they feed general answer extremity/variation, not moral character or social confidence.
- Old completed profiles remain unchanged and are compared only on shared answers. Appending questions preserves unfinished draft indices. Existing fake guests can be removed/reloaded through admin to get the new answers. No database migration needed.

## Latest feature update (September 27, 2026)

This section supersedes the historical continuation notes below.

- Vacation question is now a true two-choice **New York / California** question (`vacation_destination`, 0/100). Next and the API reject an unanswered midpoint. Drafts containing either retired question return to this question; completed old answers are not reinterpreted. There are still 14 questions total (13 sliders + this choice).
- Added organizer-only phone/email visibility on join and profile edit. `toPublic` redacts both fields server-side for every other guest, including initial tabs-layout props and `/api/party`; self and authenticated admin responses retain them. Old profiles remain guest-visible until changed. Name, school and quiz remain visible.
- Added `src/lib/cmu-programs.ts` with 282 CMU degree/major options. `CmuProgramPicker` is a searchable, styled Radix dialog with emoji + acronym + bracketed full name, keyboard support and a custom-entry fallback. Existing program text is preserved. Official sources, snapshot date, abbreviation conventions and coverage limitations are in `docs/CMU_PROGRAMS.md`.
- New **Announcements** tab at `/announcements`. `/admin` includes an announcement composer: title/message, optional 2–4 unique voting options, results and close-voting control. Guest board refreshes every 30 seconds and on focus. No email/SMS/push delivery, editing or deleting posts. One vote per guest per poll; changing a vote replaces it. Voter identities are not returned to clients.
- FileStore and SupabaseStore implement announcements and voting. Supabase uses a locked RPC upsert to enforce one vote and prevent races with closing. New tables have RLS enabled without public policies. Local files default missing announcements to an empty list.
- **Existing Supabase projects must run `supabase/migrations/20260927_announcements_and_contact_privacy.sql` before using this version.** New projects use the full schema. Migration has NOT been applied to a real Supabase instance; no credentials are configured here.
- Verification: 47 automated tests, lint, typecheck and `git diff --check` pass. Production webpack build passes with all new routes included. Tests cover actual route authorization and contact redaction, binary validation, poll input validation, persistence, replacement votes, closed polls, deleted voters, and catalog formatting/search. No browser/virtual-desktop pass repeated, per user preference. Real Supabase integration remains unverified.
- For a quick manual feature test and organizer instructions, see the last sections of README. No development server was started for this update.

## Continuation update (September 27, 2026)

- Replaced drink etiquette with `vacation_season`: snowy winter escape (0) to sunny summer getaway (100), keeping 14 questions. Captions, observations, conversation starters, and seed data are updated. Vacation preferences contribute to strength/variation of opinions, not morality, loyalty, or boundaries. Existing completed answers remain unchanged: the retired question is ignored, comparisons use shared answers, and Opinions does not invent a missing vacation response. Old unfinished drafts return to the replacement question while preserving the other answers. Existing fake guests can be removed/reloaded from admin to use the new seed answers.
- Latest requested changes supersede the activity notes below: removed the entire activity feature (onboarding, routes, API, navigation, filters, cards, admin/export columns, store methods, seeds, and new-install SQL). Existing Supabase activity tables are left untouched but unused; old JSON activity fields are excluded from public payloads. Deleted source files remain recoverable from Git.
- Quiz now warns at the intro and during the quiz that submission is permanent, then presents all 14 answers for review. Every answer has an Edit button; Back still works, and edited answers can return directly to review. Only the final explicit submit button writes answers.
- `AvatarSummary` adds an accessible Radix dialog on personal/guest avatars (results, cards, comparisons, reveal, and admin), with “You took the test…” or “<name> took the test…” introductions and explanations for all eight types. Species charts also offer generic type explanations.
- University UI is now one optional CMU/Other choice (Other reveals a text input); the form clears the old second school on save while retaining compatibility with the existing storage schema. CSV exports one university column. Intro and consent explain post-party payments/lost-item contact use.
- User clarified to prioritize features over repeating Cursor's desktop/browser QA. The historical visual checks below were not repeated; do not treat browser setup as the next required task.
- Activities tiles now navigate to their participant lists, with separate accessible join/leave buttons. Onboarding keeps its selection tiles. Both activity pages disable participation controls during saves and show save errors. Detail counts now include the viewer consistently with the “including you” label.
- `/admin` explicitly waits for a request via `connection()`. Without this, building without `ADMIN_PASSWORD` prerendered a permanently disabled login page even when the password was supplied at runtime. The new build confirms `/admin` is dynamic.
- Added the missing `.env.example` referenced by README and allowed that template through `.gitignore`. No real credentials are included.
- Dependencies installed in this workspace (Node 24). Production build passes with `npm run build -- --webpack`; default Turbopack hit a sandbox port-binding restriction here. Google Fonts requires network access during the build.
- Final checks: typecheck, lint, all 18 unit tests, and `git diff --check` pass. Run typecheck after the build, since the build regenerates `.next/types`. The temporary QA server was stopped; no server is left running by this continuation.
- Supabase integration and real-device QA remain unverified. No `.env.local` or Supabase credentials came with this workspace; previous environment/password notes below describe the original VM only.

The remaining sections preserve the original agent's verification history.

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

- Resolved in the continuation: activity tiles open participants; separate buttons toggle your participation.
- `GET /api/party` returns every guest with all answers (~1.5 KB/guest). Fine for a house party; trim if the guest list grows into the hundreds.
- `SEED_DATA` default is `true` outside production; on Vercel production the file store falls back to `/tmp` (ephemeral) with a console warning. Real party needs Supabase.
- Cookie `secure` flag is only set in production, so testing a production build over plain `http://<lan-ip>` will not keep the session; use HTTPS or dev mode for LAN testing.
- Dev-only Next.js "N" indicator overlaps the bottom-left of the CTA in dev screenshots; not present in production.

## Environment notes

- Node 22, npm. `npm install` then `npm run dev`. A tmux session named `party-dev` was running the dev server on this VM; log at `/tmp/party-dev.log`.
- `@types/node` pinned to `^22` to satisfy vitest 5 peer deps.
- `vitest.config.mts` (ESM) aliases `@` → `src`.
