/*
# 球隊球衣顏色 + 比賽球衣與天氣

1. 變更說明
- 在 teams 表新增主場與客場球衣顏色欄位，預設主場藍色、客場白色。
- 在 matches 表新增球衣（主場/客場）與天氣（晴天/陰天/雨天/陰雨）欄位，皆可為 null。

2. 新增欄位
- teams.home_kit_color (text, 預設 '#1e40af' 藍色)
- teams.away_kit_color (text, 預設 '#ffffff' 白色)
- matches.kit (text, 可為 null，值為 'home' 或 'away')
- matches.weather (text, 可為 null，值為 'sunny' / 'cloudy' / 'rainy' / 'overcast')

3. 安全性
- 無新表，RLS 政策不變。既有 anon/authenticated CRUD 政策已涵蓋新欄位。

4. 重要說明
- 球衣顏色以 CSS 色碼儲存（如 #1e40af），前端直接用於顯示色點。
- kit 與 weather 為選填，舊資料保持 null，不影響既有比賽紀錄。
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'home_kit_color'
  ) THEN
    ALTER TABLE teams ADD COLUMN home_kit_color text NOT NULL DEFAULT '#1e40af';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'away_kit_color'
  ) THEN
    ALTER TABLE teams ADD COLUMN away_kit_color text NOT NULL DEFAULT '#ffffff';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'kit'
  ) THEN
    ALTER TABLE matches ADD COLUMN kit text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'weather'
  ) THEN
    ALTER TABLE matches ADD COLUMN weather text;
  END IF;
END $$;
