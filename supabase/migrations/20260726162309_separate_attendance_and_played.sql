/*
# 出席盃賽 vs 上場比賽

## 目標
區分兩個概念：
- 「出席盃賽」：球員是否有到該盃賽（per tournament）
- 「上場比賽」：球員在該場比賽中是否有實際上場（per match）

## 1. 修改 match_performances
- 新增 `played` boolean，預設 = attended 的值（過渡期保留 attended 不動）

## 2. 新增 tournament_attendances 資料表
- (tournament_id, player_id) → attended boolean
- UNIQUE (tournament_id, player_id)

## 3. 資料遷移
- 從現有 match_performances.attended 回填 tournament_attendances
  （只要在某盃賽任一場比賽有出席，即視為該盃賽有出席）

## 4. RLS
- tournament_attendances：anon+authenticated 完整 CRUD
*/

ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS played boolean NOT NULL DEFAULT false;

-- 將現有 attended 值複製到 played
UPDATE match_performances SET played = attended WHERE played = false AND attended = true;

CREATE TABLE IF NOT EXISTS tournament_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT true,
  UNIQUE (tournament_id, player_id)
);

ALTER TABLE tournament_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_t_att" ON tournament_attendances;
CREATE POLICY "anon_select_t_att" ON tournament_attendances FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_t_att" ON tournament_attendances;
CREATE POLICY "anon_insert_t_att" ON tournament_attendances FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_t_att" ON tournament_attendances;
CREATE POLICY "anon_update_t_att" ON tournament_attendances FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_t_att" ON tournament_attendances;
CREATE POLICY "anon_delete_t_att" ON tournament_attendances FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_t_att_tournament ON tournament_attendances (tournament_id);
CREATE INDEX IF NOT EXISTS idx_t_att_player ON tournament_attendances (player_id);

-- 從現有 match_performances 回填 tournament_attendances
INSERT INTO tournament_attendances (tournament_id, player_id, attended)
SELECT DISTINCT m.tournament_id, mp.player_id, true
FROM match_performances mp
JOIN matches m ON m.id = mp.match_id
WHERE m.tournament_id IS NOT NULL AND mp.attended = true
ON CONFLICT (tournament_id, player_id) DO UPDATE SET attended = EXCLUDED.attended;
