/*
# 統一階段與名次為數字

## 階段（match stage）text → int
- 0  = 小組賽
- 16 = 16強
- 8  = 8強
- 4  = 4強
- 2  = 決賽
- 3  = 季軍賽

## 名次（tournament final_rank）int（已存在，新增 0/16/8 選項）
- null = 未定
- 0  = 小組賽出局
- 16 = 16強出局
- 8  = 8強出局
- 4  = 4強出局
- 3  = 季軍
- 2  = 亞軍
- 1  = 冠軍

## 遷移
- matches.stage text → int，舊值對照：
  '預賽' → 0, '八強' → 8, '四強' → 4, '冠軍' → 2, '季軍' → 3
*/

-- 暫存轉換：先用新 int 欄位替換
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage_new int NOT NULL DEFAULT 0;

UPDATE matches SET stage_new = CASE stage
  WHEN '預賽' THEN 0
  WHEN '八強' THEN 8
  WHEN '四強' THEN 4
  WHEN '冠軍' THEN 2
  WHEN '季軍' THEN 3
  ELSE 0
END;

ALTER TABLE matches DROP COLUMN stage;
ALTER TABLE matches RENAME COLUMN stage_new TO stage;
