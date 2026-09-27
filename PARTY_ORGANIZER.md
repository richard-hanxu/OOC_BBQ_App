# OOC BBQ — Organizer Guide

This guide covers organizer access, announcements, polls, attendee exports, and cleaning up test data. No database reset happens automatically by following links or opening the admin page.

## Quick start: become an organizer

1. Make sure the running app has an `ADMIN_PASSWORD` configured (see setup below).
2. Open your party website with `/admin` at the end:
   - Local testing: `http://localhost:4817/admin`
   - Deployed app: `https://YOUR-PARTY-SITE/admin`
3. Enter the organizer password and click **Unlock**.
4. You should see **Party control room**. Check the storage label: **supabase** means the app is connected to the configured hosted database; **file** means local JSON storage.

You do **not** need to register as an attendee or take the quiz first. Being named Richard or Andrew, clicking a host profile, or registering with a particular email does not grant organizer permissions. Access is controlled by the shared organizer password, not your Supabase account password.

Richard and Andrew can each sign in on their own devices using the organizer password. If you also want to take the quiz and vote, join normally at the root URL in the same browser; attendee and organizer sessions are separate. The organizer poll view itself displays results rather than casting votes.

Click **Lock** to sign out when finished, especially on a shared device. This does not delete records, close polls, or stop the party. Organizer sessions expire after 12 hours; sign in again when needed.

## First-time setup

### Keep credentials private

`.env.example` is a Git-trackable template, **not** the place for real passwords or secret keys. Next.js does not load `.env.example` as runtime configuration.

Create `.env.local` in the project root if it does not already exist. Do not overwrite an existing configuration. Use these exact variable names:

```dotenv
ADMIN_PASSWORD="REPLACE_WITH_A_LONG_PRIVATE_PASSWORD"
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_REPLACE_WITH_YOUR_SERVER_KEY
REQUIRE_DATABASE=true
SEED_DATA=false
```

For deployment, set these values in your hosting provider's environment settings. Restart the local server or redeploy after changing them.

Important naming details for **this app**:

- `SUPABASE_URL` is the HTTPS project API URL, not a `postgresql://` connection string.
- `SUPABASE_SERVICE_ROLE_KEY` accepts the server secret key. The variable keeps its older name even when the value begins with `sb_secret_`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` are **not read by the current storage code**. If you copied those names from a Supabase example, use the names above for this project.
- Never put a secret key in a `NEXT_PUBLIC_` variable. Never commit it, include it in screenshots, or share it with attendees.
- If real credentials were put into `.env.example` or exposed elsewhere, rotate the secret key and organizer password. Keep new values in `.env.local`/hosting settings, and return `.env.example` to placeholders. Removing a committed secret from the current file does not remove it from Git history.

### Find your Supabase values

1. Sign in to the [Supabase dashboard](https://supabase.com/dashboard) and select the project you own for this party.
2. Open **Connect** and copy the project URL into `SUPABASE_URL`.
3. Open **Settings → API Keys** and create or copy a server **secret key** (`sb_secret_...`). Put it in `SUPABASE_SERVICE_ROLE_KEY`. An existing legacy `service_role` key also works; do not use an `anon` or publishable key for this server-only store. Supabase recommends the newer secret keys. [Official API key guide](https://supabase.com/docs/guides/getting-started/api-keys)
4. Open **SQL Editor**. For a new project, paste and run [supabase/schema.sql](supabase/schema.sql). For a project already using this app's older schema, run [the privacy/announcements migration](supabase/migrations/20260927_announcements_and_contact_privacy.sql).
5. Restart/redeploy, sign in at `/admin`, and check **Storage: supabase**.
6. Register one clearly labeled test attendee. Check that their name, email and phone appear in the database's `participants` table. Delete that test profile before the party.

Vercel requires Supabase. On other hosts, `REQUIRE_DATABASE=true` prevents accidental fallback to local JSON. Incomplete credentials produce an error instead of silently selecting another store. `SEED_DATA=false` stops automatic fake attendees; it does not delete fake attendees already saved.

## Send announcements and run polls

### Post an update

1. Open `/admin` and find **Announcements** near the top.
2. Enter a **Title** (up to 120 characters) and **Message** (up to 4,000 characters).
3. Leave **Include a vote** unchecked for a plain announcement.
4. Click **Post announcement →** and look for the success message.

Attendees who have completed the quiz can read it in their **Announcements** tab. The board refreshes every 30 seconds, when the window regains focus, or when someone clicks **Refresh**. Delivery is **in-app only**: no email, SMS, or push notification is sent.

### Attach a vote

1. Enter the title and message as above.
2. Check **Include a vote**.
3. Enter two different options. Use **+ Add option** for a third or fourth. Options must be nonempty, unique, and no longer than 120 characters each.
4. Post the announcement. Watch the counts and percentages in the announcement card.
5. When finished, click **Close voting** and confirm.

Each attendee has one vote per poll and can change their selection while voting is open. The app shows aggregate results and a guest's own selection, not a public list of who voted for what. Closing is permanent in the app; results remain visible. Posting, closing, and viewing organizer controls require organizer login.

The app does not currently provide editing/deleting announcements or reopening polls. For a correction, post a follow-up message; for a replacement poll, close the old poll and create a new one. Raw vote records exist in the database and are accessible to database administrators, so do not describe voting as anonymous from database owners.

## Manage attendees

The control room shows participant counts, quiz progress, avatar distribution, and question statistics. Refresh the page to update participant counts after new guests join.

| Control | What it does |
| --- | --- |
| **Reset quiz** beside a guest | Clears submitted quiz answers and the assigned avatar so they can retake it. Keeps their name, contact information, profile, and poll votes. |
| **Delete** beside a guest | Removes their profile, contact details, answers, and poll votes. No app-level undo. |
| **Load fake guests** | Adds demo attendees for testing. Avoid during the real party. |
| **Remove all … seed guests** | Removes only marked fake attendees and their votes. Does not delete your personally registered test profile. |
| **Export contacts & answers** | Downloads a private attendee CSV. |
| **Lock** | Signs you out of organizer access. |

Names, emails and phone numbers are saved as soon as the attendee submits the join form, even if they never finish the quiz. Organizer-only contact settings hide contacts from other guests, not from organizers or the organizer export. On narrow screens the admin contact column is hidden; use a wider screen or the export to inspect contacts.

## Export records for later

### Recommended: export from the app

1. Sign in at `/admin`.
2. Click **Export contacts & answers**.
3. Save `party-participants-YYYY-MM-DD.csv` somewhere private. Rename it with a time or event name if keeping multiple snapshots.
4. Import the CSV into Excel, Numbers, or another trusted spreadsheet tool. Set phone numbers and IDs to **text** when importing to preserve `+` signs and leading zeroes. Treat guest-entered fields as untrusted text rather than spreadsheet formulas.

The export includes IDs, names, phones, emails, contact visibility, university/program, avatar, quiz status, timestamps, and question values. It includes unfinished attendees, organizer-only contacts, and fake guests (marked `is_seed=yes`). It does not contain participant session-token hashes, announcements, or poll results. This is a readable snapshot, **not a complete database backup or one-click restore file**.

### Supabase navigation and contacts-only export

Supabase supports browsing records in **Table Editor** and running queries in **SQL Editor**. [Official database overview](https://supabase.com/docs/guides/database/overview)

1. Open the correct project in the Supabase dashboard.
2. Open **Table Editor** and choose the `public` schema.
3. Select the relevant table:

   | Table | Contents |
   | --- | --- |
   | `participants` | Attendee names, contacts, privacy choice, school, avatar and quiz status. |
   | `answers` | Individual quiz answers linked by `participant_id`. |
   | `announcements` | Messages, poll option definitions, timestamps and closed status. |
   | `announcement_votes` | Raw votes linked to attendee and announcement IDs; keep private. |

Attendees are **not** Supabase Auth users. Look in `public.participants`, not **Authentication → Users**. The `participants.token_hash` field is internal session data; do not include it in routine shared contact exports. Leave row-level security enabled; the app's server key accesses the protected tables.

For a clean contact list, open **SQL Editor**, start a new query, and run:

```sql
select id, first_name, last_name, email, phone, contact_visibility,
       cmu_program, quiz_completed_at, created_at
from public.participants
where is_seed = false
order by created_at;
```

Use the query result's CSV download/export control to save the rows. Confirm the exported row count matches what you expect and that no result limit has truncated it. SQL Editor query results can be exported as CSV. [Supabase export example](https://supabase.com/docs/guides/auth/managing-user-data)

To retain announcements and poll totals without exporting voter identities, run and export this separate query:

```sql
select a.id, a.title, a.body, a.created_at, a.closed,
       option.value ->> 'label' as option_label,
       count(v.participant_id) as vote_count
from public.announcements as a
left join lateral jsonb_array_elements(a.options) as option(value) on true
left join public.announcement_votes as v
  on v.announcement_id = a.id
 and v.option_id = option.value ->> 'id'
group by a.id, option.value
order by a.created_at desc, option_label;
```

Plain announcements appear with an empty option label and zero votes. These exports remain viewable without the app, but are not full database backups. Keep the Supabase project active if you want the app to continue accessing its records.

## Reset or clean up testing data

### Small cleanup: use the app

For your own test account, prefer **Delete** beside that exact participant in `/admin`. For another quiz attempt while preserving contacts, use **Reset quiz** instead. Remove seeded fake attendees separately with **Remove all … seed guests**.

### Full Supabase wipe — destructive

**This deletes ALL attendees, their contact details and answers, ALL announcements, and ALL votes in the selected project. It is not limited to test records. There is no app-level undo. Export what you need first, and arrange a database backup if you need full recovery.**

1. Stop the local app, or put a deployed app into a maintenance state so attendees cannot submit new records during the wipe.
2. Confirm the Supabase project URL matches the app you intend to reset. Do not run this against an active party or a different environment.
3. Export contacts and any announcement/poll history you want to retain.
4. In **SQL Editor**, inspect the counts first:

   ```sql
   select 'participants' as table_name, count(*) as rows from public.participants
   union all
   select 'answers', count(*) from public.answers
   union all
   select 'announcements', count(*) from public.announcements
   union all
   select 'announcement_votes', count(*) from public.announcement_votes;
   ```

5. Only if every record in these app tables is intended for deletion, run:

   ```sql
   begin;

   delete from public.announcement_votes;
   delete from public.answers;
   delete from public.announcements;
   delete from public.participants;

   commit;
   ```

6. Re-run the count query; all four counts should be zero. The schema, security policies and voting function remain, so you do not need to recreate the tables.
7. Keep `SEED_DATA=false`, then restart/re-enable the app.
8. Clear site cookies and local storage in your testing browser, or use a new private browser session, to remove the old attendee cookie and any saved quiz draft. Clear data for this app's origin only. This also signs you out of the organizer page; sign in again at `/admin`.

The wipe does not delete your Supabase project, API keys, or organizer password. Previously downloaded CSVs and backups are separate copies; wiping the database does not erase those.

### If the app says “Storage: file”

Supabase SQL will not affect local JSON data. The default file is `.data/party.json`; `DATA_FILE` can override that path.

1. Stop the app to prevent writes from its in-memory store.
2. Export anything you need. Locate the exact configured data file.
3. Rename that file to an unused backup filename using your file manager. Do not overwrite a prior backup or delete the entire project directory.
4. Set `SEED_DATA=false` in `.env.local`, then restart. A new empty local store will be created when needed.
5. Clear this app's browser cookies/local storage for a completely fresh test.

The renamed file contains private contact information: keep it private and dispose of it deliberately when no longer needed. Switching from file storage to Supabase does not migrate local attendees automatically.

## Troubleshooting

- **“Set ADMIN_PASSWORD” on the organizer page:** configure it in `.env.local` or hosting environment variables, not just `.env.example`, then restart/redeploy.
- **Password rejected:** use the app's `ADMIN_PASSWORD`, not your Supabase login or database password. Check which deployment/environment you opened.
- **Storage says file unexpectedly:** verify the exact `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` names and restart. Set `REQUIRE_DATABASE=true` to prevent fallback.
- **Database error or missing tables/function:** confirm you ran the full schema or relevant migration in the correct project. Keep the secret key server-side; don't disable RLS to work around errors.
- **Guests cannot see announcements:** guests must join and finish the quiz to reach the tab. Use **Refresh** or wait up to 30 seconds. Announcements do not send external notifications.
- **Fake profiles remain with SEED_DATA=false:** the flag does not delete existing rows; use the admin seed-removal button.
- **Test answers reappear after a database reset:** clear this app's local storage; quiz drafts are stored in the browser separately from submitted answers.

## Before guests arrive / after they leave

- Before: confirm Supabase storage, test organizer login and one announcement, remove test profiles and fake guests, set `SEED_DATA=false`, and share only the attendee URL/QR code.
- After: export contacts and any poll results you need, store downloads privately, use contacts for the stated payment/lost-item follow-up, and remove personal data when no longer needed.
