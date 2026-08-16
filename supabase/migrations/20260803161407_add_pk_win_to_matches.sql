/*
# Add PK (penalty shootout) win column to matches

1. Modified Tables
- `matches`
  - Added `pk_win` (boolean, nullable, default null) — records whether
    our team won the penalty shootout when the match ended in a draw.
    - `true`  = we won on penalties (result = win)
    - `false` = we lost on penalties (result = loss)
    - `null`  = no penalty shootout (normal win/loss/draw)

2. Security
- No RLS policy changes — the existing policies on `matches` already
  cover all CRUD operations. The new column inherits the same policies.

3. Important Notes
- The column is nullable so existing rows are unaffected (all stay null).
- The frontend `getResult()` function will be updated to check `pk_win`
  when `our_score === opp_score`: if `pk_win` is true → win, false → loss,
  null → draw.
- The edge function `update-match` action will be updated to accept and
  persist the `pkWin` field.
*/

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS pk_win boolean DEFAULT null;
