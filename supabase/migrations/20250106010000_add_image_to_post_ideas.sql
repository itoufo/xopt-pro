-- post_ideasテーブルに画像フィールドを追加
ALTER TABLE xopt.post_ideas ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE xopt.post_ideas ADD COLUMN IF NOT EXISTS image_prompt TEXT;

-- Supabase Storageのバケットを作成（手動で行う必要がある場合もあり）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
-- ON CONFLICT (id) DO NOTHING;
