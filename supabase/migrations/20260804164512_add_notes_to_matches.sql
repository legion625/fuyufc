/*
# Add notes column to matches table

1. Changes
- Add `notes` text column to `matches` table, nullable, default empty string.
- Allows free-form remarks per match (e.g. weather, referee notes, special events).
2. Security
- No RLS policy changes needed; existing policies on `matches` already cover the new column.
*/

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
