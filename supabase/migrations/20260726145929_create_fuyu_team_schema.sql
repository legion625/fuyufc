/*
# 富譽小將 U8 賽事紀錄資料庫

1. 新增資料表
- `players`：球員名單（姓名、背號）
- `matches`：比賽紀錄（日期、盃賽名稱、地點、對手、我方比分、對方比分）
- `match_performances`：每場每位球員的表現（是否出席、進球數、助攻數）

2. 安全性
- 所有資料表啟用 RLS。
- 因本應用無登入畫面（單一球隊共用資料），所有政策開放給 anon + authenticated 完整 CRUD。
- 資料為 intentionally public/shared。

3. 重要說明
- match_performances 結合出席紀錄與進球/助攻統計，每位球員每場比賽一列。
- result（勝/負/和）由前端依比分計算，不另存欄位。
- 新增常用查詢欄位的索引。
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jersey_number int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date date NOT NULL,
  tournament text NOT NULL,
  location text NOT NULL,
  opponent text NOT NULL,
  our_score int NOT NULL DEFAULT 0,
  opp_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS match_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT false,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  UNIQUE (match_id, player_id)
);

ALTER TABLE match_performances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_performances" ON match_performances;
CREATE POLICY "anon_select_performances" ON match_performances FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_performances" ON match_performances;
CREATE POLICY "anon_insert_performances" ON match_performances FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_performances" ON match_performances;
CREATE POLICY "anon_update_performances" ON match_performances FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_performances" ON match_performances;
CREATE POLICY "anon_delete_performances" ON match_performances FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_opponent ON matches (opponent);
CREATE INDEX IF NOT EXISTS idx_performances_match ON match_performances (match_id);
CREATE INDEX IF NOT EXISTS idx_performances_player ON match_performances (player_id);
