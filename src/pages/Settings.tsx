import { Key, Database } from 'lucide-react';

export function Settings() {
  const settings = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="mt-1 text-gray-500">アプリケーション設定</p>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">API設定</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          API設定は.env.localファイルで管理されます。以下は現在の設定状態です。
        </p>
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-2">
              <Database className="w-4 h-4" />
              Supabase URL
            </label>
            <input
              type="text"
              value={settings.supabaseUrl ? '設定済み' : '未設定'}
              disabled
              className="input bg-gray-50"
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Key className="w-4 h-4" />
              Supabase Anon Key
            </label>
            <input
              type="text"
              value={settings.supabaseKey ? '設定済み' : '未設定'}
              disabled
              className="input bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">セットアップ手順</h2>
        <ol className="list-decimal list-inside space-y-3 text-blue-800">
          <li>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Supabase
            </a>
            でプロジェクトを作成
          </li>
          <li>プロジェクトルートに.env.localファイルを作成</li>
          <li>以下の環境変数を設定：
            <pre className="mt-2 p-3 bg-blue-100 rounded text-sm overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
            </pre>
          </li>
          <li>Supabaseでデータベーステーブルを作成（SQLは下記参照）</li>
          <li>アプリを再起動</li>
        </ol>
      </div>

      {/* Database Schema */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">データベーススキーマ</h2>
        <p className="text-sm text-gray-500 mb-4">
          Supabase SQL Editorで以下のSQLを実行してテーブルを作成してください。
        </p>
        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
{`-- クライアント管理
CREATE TABLE clients (
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
CREATE TABLE profile_designs (
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
CREATE TABLE post_ideas (
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
CREATE TABLE daily_logs (
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
CREATE TABLE monthly_summaries (
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

-- RLSを有効化（必要に応じて）
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- 開発用：全てのユーザーにアクセスを許可
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON profile_designs FOR ALL USING (true);
CREATE POLICY "Allow all" ON post_ideas FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_logs FOR ALL USING (true);
CREATE POLICY "Allow all" ON monthly_summaries FOR ALL USING (true);`}
        </pre>
      </div>
    </div>
  );
}
