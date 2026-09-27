-- Optional, organizer-visible food/supplies note. Existing attendees need no update.
alter table public.participants
  add column if not exists brought_items text
  check (char_length(brought_items) <= 500);
