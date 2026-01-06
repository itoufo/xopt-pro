-- クライアント管理
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  x_handle TEXT,
  x_user_id TEXT,
  x_access_token TEXT,
  x_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロフィール設計
CREATE TABLE IF NOT EXISTS profile_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  target_persona TEXT,
  what_to_deliver TEXT,
  future_promise TEXT,
  achievements TEXT,
  career_history TEXT,
  profile_text TEXT,
  header_copy TEXT,
  fixed_tweet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 思想まとめ（投稿ネタ）
CREATE TABLE IF NOT EXISTS post_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'useful',
  title TEXT,
  content TEXT NOT NULL,
  character_count INT DEFAULT 0,
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 日別ログ
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  post_idea_id UUID REFERENCES post_ideas(id),
  log_date DATE NOT NULL,
  post_type TEXT,
  content TEXT,
  impressions INT DEFAULT 0,
  likes INT DEFAULT 0,
  profile_clicks INT DEFAULT 0,
  detail_clicks INT DEFAULT 0,
  retweets INT DEFAULT 0,
  replies INT DEFAULT 0,
  replies_made INT DEFAULT 0,
  follower_count INT DEFAULT 0,
  follower_change INT DEFAULT 0,
  profile_click_rate DECIMAL DEFAULT 0,
  follow_rate DECIMAL DEFAULT 0,
  tweet_url TEXT,
  analytics_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月別サマリー
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  tweet_count INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_profile_clicks INT DEFAULT 0,
  total_detail_clicks INT DEFAULT 0,
  total_replies_received INT DEFAULT 0,
  follower_change INT DEFAULT 0,
  avg_impressions DECIMAL DEFAULT 0,
  avg_likes DECIMAL DEFAULT 0,
  avg_profile_clicks DECIMAL DEFAULT 0,
  profile_click_rate DECIMAL DEFAULT 0,
  follow_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Allow all" ON clients;
DROP POLICY IF EXISTS "Allow all" ON profile_designs;
DROP POLICY IF EXISTS "Allow all" ON post_ideas;
DROP POLICY IF EXISTS "Allow all" ON daily_logs;
DROP POLICY IF EXISTS "Allow all" ON monthly_summaries;

-- 開発用：全てのユーザーにアクセスを許可
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON profile_designs FOR ALL USING (true);
CREATE POLICY "Allow all" ON post_ideas FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_logs FOR ALL USING (true);
CREATE POLICY "Allow all" ON monthly_summaries FOR ALL USING (true);
