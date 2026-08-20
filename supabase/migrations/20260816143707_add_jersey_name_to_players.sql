/*
# Add jersey_name column to players

1. Modified Tables
- `players`
  - New column `jersey_name` (text, nullable): the name printed on the player's jersey, which may differ from the roster name (e.g. nickname or romanized spelling). Optional; null means no jersey name recorded.
2. Security
- No RLS / policy changes. Existing players policies continue to apply.
3. Notes
- Column is added with `IF NOT EXISTS` so the migration is safe to re-apply.
- No destructive operations; existing data is untouched.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_name text;