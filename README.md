# Pool Party Personality

A mobile-first party game for a university house party. Guests scan a QR code, fill in a short profile, answer **exactly 16 questions (15 sliders and a New York/California choice)** about fries, robots, Irish exits and questionable money decisions, review their answers, and get an automatically assigned **party type** (Ghost, Life of the Party, Chameleon, Drinking Machine, Game Goblin, Side Quest, Observer, Kitchen NPC). Then they can see who they align with and who they'd fight over the aux with. Clicking a guest's avatar explains their party type.

Everything is a private directory for guests only: `noindex`, `robots.txt` disallow, and guest data endpoints require a participant cookie; organizer endpoints require an admin session.

## Attendee guide

1. Scan the organizer's QR code or open the party link on your phone.
2. Enter your name, email and phone number. These are saved when you submit the join form, so organizers can follow up about payments or lost items even if you don't finish the quiz. University is optional: choose CMU and search for your degree, or choose Other and type your university.
3. Enable **Keep my phone and email organizer-only** if you don't want other guests to see your contact details. Organizers still have access. Accept the notice and start the quiz.
4. Answer the 16 questions. Use **Back** as needed, then review and edit your answers. Nothing is final until **Submit permanently & reveal**. After submission, only an organizer can reset the quiz.
5. Explore the tabs: **Me** shows your party type and matches; **People** lets you compare answers with guests; **Opinions** shows the room's takes; **Announcements** shows organizer updates and polls. Tap any avatar to learn what it means.
6. Vote once per poll; selecting a different option changes your vote until voting closes. You can edit your contact details and privacy choice from **Me → Edit profile** without retaking the quiz.

Return using the same browser to keep your session. This app has no email/password login or account recovery: clearing cookies or switching devices can create a second profile. The history-sharing question is hypothetical; no YouTube or ChatGPT history is collected.

## Organizer guide

### Before the party: connect your database

The app already writes each attendee's name, email and phone to the configured store as soon as they join. For a database you can access after the party, connect **your own Supabase project**:

1. Create a Supabase project under an account you control. In its SQL editor, run [supabase/schema.sql](supabase/schema.sql). If you already installed an older schema, use [the upgrade migration](supabase/migrations/20260927_announcements_and_contact_privacy.sql) instead.
2. Set these server environment variables in `.env.local` for local use, or in your hosting environment for deployment:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SERVICE_ROLE_KEY
   ADMIN_PASSWORD=YOUR_LONG_PRIVATE_PASSWORD
   REQUIRE_DATABASE=true
   SEED_DATA=false
   ```

   Never expose the service-role key with a `NEXT_PUBLIC_` prefix, commit it, or share it with guests. This repository does not include database credentials and does not provision a database automatically.

3. Restart or redeploy the app. Open `/admin`, sign in with `ADMIN_PASSWORD`, and confirm **Storage: supabase**. If it says **file**, contacts are in local JSON, not Supabase. Vercel requires Supabase; other hosts can enforce the same check with `REQUIRE_DATABASE=true`. Missing or incomplete database configuration is rejected rather than silently collecting contacts in temporary storage.
4. Join once with a clearly labeled test profile, confirm it appears in `/admin` and `public.participants` in Supabase, then remove only that test profile. `SEED_DATA=false` prevents automatic fake guests but does not remove existing ones; use **Remove all seed guests** if needed.
5. Share your deployed app URL or a QR code pointing to it. Keep the organizer password private.

### During the party

- Visit `/admin` directly; you don't need to join or complete the attendee quiz to organize.
- Use **Announcements** to post a title and message. Optionally add a poll with 2–4 options; guests can change their vote until you choose **Close voting**. Updates appear in-app, not by email or SMS.
- View participants and quiz progress, inspect aggregate results, and reset a guest's quiz when needed. **Reset quiz** preserves their name and contact details; **Delete** removes their profile, answers and votes.
- Use **Lock** when finished on a shared device. This signs out the organizer; it does not end the party or delete records.

### After the party: retrieve attendee contacts

Open `/admin` and select **Export contacts & answers**. The CSV contains each attendee's ID, name, phone, email, contact-visibility preference, university/program, quiz answers and timestamps. It includes unfinished profiles and organizer-only contacts. Guest sessions cannot use this export. Fake guests are marked in the `is_seed` column.

You can also access the database directly in your Supabase project: open the table editor and select `public.participants`. For a contacts-only list, run this read-only query in the SQL editor:

```sql
select id, first_name, last_name, email, phone, contact_visibility,
       quiz_completed_at, created_at
from public.participants
where is_seed = false
order by created_at;
```

Contact records stay in your Supabase database when the app restarts or is redeployed, and do not expire when the party ends or browser cookies expire. They remain until deleted by an organizer or database administrator. Keep the database project active, back up/export contacts before deleting anything, and store downloads privately. Use contact information for the stated party follow-up purposes and remove it when no longer needed.

Local development without Supabase saves to `.data/party.json` (or `DATA_FILE`), which persists across restarts on the same disk but is **not a hosted database or a backup**. Do not delete that file if you need the records. Switching from local storage to Supabase does not migrate earlier attendees automatically; export existing records before switching.

## Stack

- Next.js 16 (App Router, Route Handlers), TypeScript, Tailwind 4, a few shadcn/ui primitives
- Storage: **Supabase Postgres** when configured, otherwise a zero-dependency **JSON file store** (`.data/party.json`) for local dev
- No image assets: avatars are inline SVG, confetti and animations are CSS
- Vitest for scoring, compatibility, privacy, polls and API authorization

## Run it locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD
npm run dev                  # http://localhost:4817
```

Out of the box the file store is used and 12 fake guests are seeded (see `src/lib/seed.ts`), so People / Opinions have data immediately.

Other scripts: `npm test` (unit tests), `npm run lint`, `npm run typecheck`, `npm run build && npm start`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Enables `/admin` (organizer page). Required for announcements / polls / delete / reset / CSV export / seed management. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Use Supabase Postgres. Run `supabase/schema.sql` in the SQL editor first. The service-role key is only ever used server-side; RLS stays on with no anon policies. |
| `SEED_DATA` | `true`/`false`. Defaults to `true` outside production. Controls automatic seeding of an empty **file** store. Seed guests can also be loaded / removed from `/admin` on any store. |
| `DATA_FILE` | Override the JSON file path for the file store. |
| `REQUIRE_DATABASE` | Set `true` to reject local-file fallback. Vercel always requires Supabase. |

### Before the real party

1. Create a Supabase project, run `supabase/schema.sql`, set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
2. Set `ADMIN_PASSWORD`.
3. Set `SEED_DATA=false` (or open `/admin` → "Remove all seed guests").
4. Deploy to Vercel and print a QR code pointing at the root URL.

Vercel deployments require Supabase; the app refuses to collect attendee details in ephemeral `/tmp` storage.

## How it works

- **Flow**: `/` welcome → `/join` profile (one CMU/Other university choice; CMU shows a searchable, emoji-labeled degree picker, Other accepts a university name) → `/quiz` (15 sliders, a New York/California choice, and final answer review) → `/reveal` → tabs `/me`, `/people`, `/opinions`, `/announcements`.
- **Session**: a random token is stored in an httpOnly cookie; only its SHA-256 hash is stored server-side. Refreshing keeps the session. The quiz cannot be retaken unless the organizer resets it from `/admin`.
- **Quiz**: slider movement is purely local. The draft is saved to `localStorage` on release/advance. Guests can go Back or edit any answer from the final review. Only the explicit “Submit permanently & reveal” action sends all 16 answers in one `POST /api/me/answers`, where the avatar is computed and stored. Submitted answers cannot be edited by guests.
- **Avatar summaries**: click an avatar on results, guest cards, comparisons, or the reveal to open its explanation. The summary starts with “You took the test…” for yourself or the guest's name for someone else. The dialog supports keyboard focus, Escape, and closing without navigation.
- **Money sliders** (`assistant_pay`, `assistant_salary`, `phone_price`) map the 0–100 position onto nonlinear dollar stops; the stored `display_value` is the dollar string, and compatibility always compares normalized positions.
- **Avatars** (`src/lib/avatars.ts`): 16 answers → lightweight dimensions (`src/lib/dimensions.ts`) → weighted score per avatar → highest wins with a fixed tie-break order. No randomness; identical answers always produce the same type.
- **Compatibility** (`src/lib/compatibility.ts`): mean of `1 − |a − b| / 100` across all 16 questions. Also derives closest takes, biggest disagreements, money gaps and templated conversation starters.
- **Data loading**: one `GET /api/party` returns the viewer plus every guest and their answers. Compatibility for every card is computed once per refresh in a memoized map on the device; the tabs layout also server-renders the initial payload so there's no loading flash.

## Project layout

```
src/lib/questions.ts        the 16 questions: labels, live captions, party captions, templates
src/lib/money.ts            nonlinear money slider mapping + formatting
src/lib/dimensions.ts       party dimensions from answers
src/lib/avatars.ts          avatar metadata + deterministic assignment
src/lib/compatibility.ts    pairwise comparison + conversation starters
src/lib/stats.ts            party-wide aggregates (Opinions / admin)
src/lib/seed.ts             fake guests covering every avatar
src/lib/cmu-programs.ts     282 sourced CMU degree / major options
src/lib/announcements.ts    announcement validation and privacy-safe poll results
src/lib/store/              Store interface, FileStore, SupabaseStore
src/app/api/                route handlers (participants, me, party, admin)
src/app/(tabs)/             Me / People / Opinions / Announcements with bottom nav
src/components/             slider, avatar SVGs, cards, party data provider
supabase/schema.sql         Postgres schema for new installs
supabase/migrations/        upgrades for existing Supabase projects
```

## Announcements and voting

Open `/admin`, sign in with `ADMIN_PASSWORD`, and use **Announcements** at the top of the control room. Enter a title and message, optionally enable **Include a vote**, enter 2–4 unique options, and post. Guests see updates in the **Announcements** tab; it refreshes every 30 seconds and on window focus. Messages are in-app only (no SMS, email, or push delivery).

Each guest has one vote per poll and may change it until the organizer selects **Close voting**. Results show totals and the viewer's own selection, never a list of voters. Closing a poll is permanent. Existing posts cannot yet be edited or deleted through the UI.

### Existing Supabase installations

Before running this version against an existing database, run [the privacy and announcements migration](supabase/migrations/20260927_announcements_and_contact_privacy.sql) in Supabase's SQL editor. It adds the contact-visibility column, announcement/vote tables, RLS, and an atomic voting function. New projects can instead run the full `supabase/schema.sql`. Local JSON data needs no manual migration.

## Contact privacy and CMU programs

Guests can check **Keep my phone and email organizer-only** when joining or editing their profile. The server removes both fields from other guests' API and initial page payloads; the owner and authenticated organizers retain access. Names, university and quiz answers stay visible to joined guests. Existing profiles retain their previous guest-visible contact setting until changed. Privacy changes cannot retract details someone already viewed or copied.

The CMU picker uses `emoji ACRONYM [Full degree name]`, with search by degree, acronym or school and a custom-entry fallback. [Catalog scope and official CMU sources](docs/CMU_PROGRAMS.md) explain degree names, abbreviations, graduate variants and exclusions.

## Quick feature check

1. Start with `npm run dev` and open http://localhost:4817.
2. Join, enable organizer-only contact, choose CMU and search for your degree.
3. Complete the quiz: question 9 requires New York or California. Review and edit before submitting.
4. In another browser/private session, join as a second guest; the first guest's contact card should be hidden.
5. Open `/admin`, post a message with a two-option poll, and visit **Announcements** as a guest. Vote twice for different options: the total stays at one. Close voting in admin and verify the guest can no longer vote.
6. `npm test`, `npm run lint`, and `npm run typecheck` run the automated checks. If this environment cannot run Turbopack, use `npm run build -- --webpack`.
