-- xoptスキーマを作成
CREATE SCHEMA IF NOT EXISTS xopt;

-- publicスキーマのテーブルをxoptスキーマに移動
ALTER TABLE IF EXISTS clients SET SCHEMA xopt;
ALTER TABLE IF EXISTS profile_designs SET SCHEMA xopt;
ALTER TABLE IF EXISTS post_ideas SET SCHEMA xopt;
ALTER TABLE IF EXISTS daily_logs SET SCHEMA xopt;
ALTER TABLE IF EXISTS monthly_summaries SET SCHEMA xopt;

-- xoptスキーマへのアクセス権限を付与
GRANT USAGE ON SCHEMA xopt TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA xopt TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA xopt TO anon, authenticated;

-- デフォルトの権限を設定（将来のテーブル用）
ALTER DEFAULT PRIVILEGES IN SCHEMA xopt GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA xopt GRANT ALL ON SEQUENCES TO anon, authenticated;
