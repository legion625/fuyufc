/*
# Add status column to player_team_memberships

## 目標
將球員-球隊關聯從二值（active true/false）改為三態，
讓「未加入」也能以紀錄形式保留，避免刪除紀錄造成狀態不一致。

## 變更
1. 新增 `status` text 欄位，允許值：'active'（在隊）、'inactive'（離隊）、'not_joined'（未加入）
2. 預設值 'active'
3. 加上 CHECK 條件限制只能這三個值
4. 將既有資料遷移：active=true → 'active'，active=false → 'inactive'
5. 建立 trigger 自動同步 active 欄位（保持向下相容）：
   - status='active' → active=true
   - status='inactive' 或 'not_joined' → active=false
6. 既有程式碼依賴 active 欄位篩選在隊球員，trigger 確保不需同時改所有查詢

## 注意
- 不刪除 active 欄位，保持向下相容
- 不刪除任何資料
*/

ALTER TABLE player_team_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'not_joined'));

-- 遷移既有資料
UPDATE player_team_memberships SET status = 'active' WHERE active = true AND status = 'active';
UPDATE player_team_memberships SET status = 'inactive' WHERE active = false AND status = 'active';

-- 建立同步 trigger：status 變更時自動更新 active
DROP TRIGGER IF EXISTS sync_membership_active ON player_team_memberships;
DROP FUNCTION IF EXISTS sync_membership_active_fn();

CREATE FUNCTION sync_membership_active_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.active := (NEW.status = 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_membership_active
  BEFORE INSERT OR UPDATE OF status ON player_team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION sync_membership_active_fn();

-- 重新同步一次確保一致
UPDATE player_team_memberships SET active = (status = 'active');

-- 索引：加速 status 查詢
CREATE INDEX IF NOT EXISTS idx_memberships_status ON player_team_memberships (status);
