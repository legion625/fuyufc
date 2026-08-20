/*
# Add competition type to tournaments

1. Changes
- Add `type` column to `tournaments` table: text, NOT NULL, default 'cup'.
  Values: 'cup' (盃賽), 'league' (季賽), 'friendly' (友誼賽).
- Existing rows default to 'cup' since all current tournaments are cups.
2. Security
- No RLS policy changes. Existing policies on tournaments remain unchanged.
3. Notes
- The column is additive — no data loss, no type changes, no renames.
- The frontend will use this column to show type-appropriate labels and
  hide the "stage" selector for league-type competitions.
*/

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'cup';

-- Backfill: ensure all existing rows have 'cup' (idempotent safety)
UPDATE tournaments SET type = 'cup' WHERE type IS NULL OR type = '';
