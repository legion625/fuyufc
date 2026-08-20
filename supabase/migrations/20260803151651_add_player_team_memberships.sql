/*
# 球員所屬球隊（多對多關聯）

## 目標
讓每個球員可以同時屬於多個球隊（例如 U8 和 U10），但隨年齡增長可能離開某隊。
歷史紀錄（比賽、出席、表現）不受影響——比賽紀錄直接掛在 matches 表，不依賴此關聯表。

## 1. 新增資料表
- `player_team_memberships`
  - `id` uuid PK
  - `player_id` uuid REFERENCES players(id) ON DELETE CASCADE
  - `team_id` uuid REFERENCES teams(id) ON DELETE CASCADE
  - `active` boolean DEFAULT true — 是否仍屬於該隊（false = 已離隊，保留紀錄）
  - `created_at` timestamptz DEFAULT now()
  - UNIQUE (player_id, team_id) — 同一球員同一球隊僅一列

## 2. 資料遷移
- 既有球員一律歸屬預設 U8 隊（active = true），確保舊資料不中斷。

## 3. RLS
- anon + authenticated 完整 CRUD（與其他表一致，無登入畫面）。

## 4. 索引
- player_id、team_id 查詢索引。
*/

CREATE TABLE IF NOT EXISTS player_team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (player_id, team_id)
);

ALTER TABLE player_team_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memberships" ON player_team_memberships;
CREATE POLICY "anon_select_memberships" ON player_team_memberships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memberships" ON player_team_memberships;
CREATE POLICY "anon_insert_memberships" ON player_team_memberships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memberships" ON player_team_memberships;
CREATE POLICY "anon_update_memberships" ON player_team_memberships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memberships" ON player_team_memberships;
CREATE POLICY "anon_delete_memberships" ON player_team_memberships FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_memberships_player ON player_team_memberships (player_id);
CREATE INDEX IF NOT EXISTS idx_memberships_team ON player_team_memberships (team_id);

-- 既有球員歸屬 U8 隊
INSERT INTO player_team_memberships (player_id, team_id, active)
SELECT p.id, t.id, true
FROM players p
CROSS JOIN teams t
WHERE t.slug = 'u8'
ON CONFLICT (player_id, team_id) DO NOTHING;
