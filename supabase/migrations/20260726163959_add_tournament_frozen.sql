/*
# 盃賽鎖定功能

## 目標
盃賽可被管理者「鎖定」或「解鎖」，鎖定後比賽內容不可編輯。
鎖定/解鎖與刪除一樣需管理者權限。

## 1. 修改資料表
- `tournaments` 新增 `frozen boolean DEFAULT false`

## 2. 預存程序（SECURITY DEFINER）
- set_tournament_frozen(p_tournament, p_frozen, p_admin_password) → boolean
  需 admin 密碼才能切換鎖定狀態。
*/

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION set_tournament_frozen(
  p_tournament uuid,
  p_frozen boolean,
  p_admin_password text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT verify_admin_password(p_admin_password) THEN
    RETURN false;
  END IF;
  UPDATE tournaments SET frozen = p_frozen WHERE id = p_tournament;
  RETURN true;
END;
$$;
