/*
# 修正 teams 表缺少 INSERT/UPDATE/DELETE RLS policies

## 問題
teams 表只有 SELECT policy (anon_select_teams)，缺少 INSERT/UPDATE/DELETE。
導致前端無法新增球隊，出現「建立失敗」。

## 修正
新增三條 policy，與其他表一致的 anon + authenticated 全開放。
*/

DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);
