/*
# 多球隊架構與團隊密碼驗證

## 目標
支援多個球隊（U8、U10…），球員為全域共用（隨年齡升級換隊），比賽掛 team_id。
瀏覽與登錄維持免登入開放；刪除比賽需該隊密碼；總管理者可設定各隊與總管密碼。

## 1. 新增資料表
- `teams`：球隊（id, name, slug, created_at）
- `team_passwords`：各隊密碼雜湊（team_id, password_hash, updated_at）。RLS 完全鎖定。
- `app_config`：單列設定（key, value）。存放 admin_password_hash。RLS 完全鎖定。

## 2. 修改資料表
- `matches` 新增 `team_id uuid REFERENCES teams(id)` NOT NULL。舊資料指派給預設 U8。

## 3. 安全性
- `team_passwords`、`app_config`：啟用 RLS，不建立任何 policy → 完全鎖定，僅 service role 可存取。
- `matches`：SELECT/INSERT/UPDATE 維持 anon+authenticated 開放。DELETE 透過 edge function + service role 執行，前端一律呼叫 edge function 刪除（edge function 內驗證該隊密碼）。

## 4. 預設資料
- 預設球隊「富譽小將 U8」。預設 U8 密碼「fuyu8」、admin 密碼「admin」。

## 5. 預存程序（SECURITY DEFINER，回傳 boolean，不回傳雜湊）
- verify_team_password / verify_admin_password
- set_team_password（需 admin 密碼）/ set_admin_password（需舊 admin 密碼）
- 使用 extensions.digest（pgcrypto 置於 extensions schema），schema-qualified 避開 search_path 問題。
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);

INSERT INTO teams (name, slug)
SELECT '富譽小將 U8', 'u8'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'u8');

UPDATE matches
SET team_id = (SELECT id FROM teams WHERE slug = 'u8')
WHERE team_id IS NULL;

ALTER TABLE matches ALTER COLUMN team_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_team ON matches (team_id);

CREATE TABLE IF NOT EXISTS team_passwords (
  team_id uuid PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_passwords ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO team_passwords (team_id, password_hash)
SELECT t.id, encode(extensions.digest('fuyu8', 'sha256'), 'hex')
FROM teams t
WHERE t.slug = 'u8'
ON CONFLICT (team_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = now();

INSERT INTO app_config (key, value)
VALUES ('admin_password_hash', encode(extensions.digest('admin', 'sha256'), 'hex'))
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

CREATE OR REPLACE FUNCTION verify_team_password(p_team uuid, p_password text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_passwords
    WHERE team_id = p_team
      AND password_hash = encode(digest(p_password, 'sha256'), 'hex')
  );
$$;

CREATE OR REPLACE FUNCTION verify_admin_password(p_password text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_config
    WHERE key = 'admin_password_hash'
      AND value = encode(digest(p_password, 'sha256'), 'hex')
  );
$$;

CREATE OR REPLACE FUNCTION set_team_password(p_team uuid, p_password text, p_admin_password text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT verify_admin_password(p_admin_password) THEN
    RETURN false;
  END IF;
  INSERT INTO team_passwords (team_id, password_hash, updated_at)
  VALUES (p_team, encode(digest(p_password, 'sha256'), 'hex'), now())
  ON CONFLICT (team_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION set_admin_password(p_old text, p_new text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT verify_admin_password(p_old) THEN
    RETURN false;
  END IF;
  UPDATE app_config
  SET value = encode(digest(p_new, 'sha256'), 'hex'), updated_at = now()
  WHERE key = 'admin_password_hash';
  RETURN true;
END;
$$;
