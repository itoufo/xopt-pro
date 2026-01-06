-- キーワード候補テーブル
CREATE TABLE IF NOT EXISTS xopt.keyword_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES xopt.clients(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'useful',
  hooks TEXT[],
  status TEXT DEFAULT 'unused', -- unused, used, archived
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE xopt.keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- 開発用：全てのユーザーにアクセスを許可
CREATE POLICY "Allow all" ON xopt.keyword_suggestions FOR ALL USING (true);

-- インデックス
CREATE INDEX idx_keyword_suggestions_client_id ON xopt.keyword_suggestions(client_id);
CREATE INDEX idx_keyword_suggestions_status ON xopt.keyword_suggestions(status);
