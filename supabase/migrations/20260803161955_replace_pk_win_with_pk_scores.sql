/*
# Replace pk_win boolean with pk_our + pk_opp integer columns

1. Modified Tables
- `matches`
  - Added `pk_our`  (smallint, nullable) — our penalty shootout score
  - Added `pk_opp`  (smallint, nullable) — opponent penalty shootout score
  - Dropped `pk_win` (boolean) — replaced by the two score columns above.
    PK result is now derived: pk_our > pk_opp = PK win, pk_our < pk_opp = PK loss,
    both null = no penalty shootout.

2. Data Migration
- Existing rows with pk_win = true  → pk_our = 1, pk_opp = 0
- Existing rows with pk_win = false → pk_our = 0, pk_opp = 1
- Existing rows with pk_win = null  → both stay null (no PK)

3. Security
- No RLS policy changes — the existing policies on `matches` already
  cover all CRUD operations. The new columns inherit the same policies.
*/

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS pk_our smallint DEFAULT null,
  ADD COLUMN IF NOT EXISTS pk_opp smallint DEFAULT null;

-- Migrate existing boolean values into the new score columns
UPDATE matches SET pk_our = 1, pk_opp = 0 WHERE pk_win = true;
UPDATE matches SET pk_our = 0, pk_opp = 1 WHERE pk_win = false;

-- Drop the old boolean column
ALTER TABLE matches DROP COLUMN IF EXISTS pk_win;
