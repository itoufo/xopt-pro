-- 全体設計（ブランド戦略）テーブル
CREATE TABLE IF NOT EXISTS xopt.brand_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES xopt.clients(id) ON DELETE CASCADE UNIQUE,

  -- 事業コンセプト
  mission TEXT,                    -- ミッション
  vision TEXT,                     -- ビジョン
  values TEXT,                     -- 価値観

  -- 誰が（権威性・実績）
  social_proof TEXT,               -- 社会的証明
  authority TEXT,                  -- 権威性
  achievements_detail TEXT,        -- 実績詳細
  career_detail TEXT,              -- 経歴詳細

  -- 誰に（ペルソナ詳細）
  persona_demographics TEXT,       -- 年齢・性別・職業・収入
  persona_psychographics TEXT,     -- 心理特性・価値観
  persona_pain_points TEXT,        -- 悩み・課題
  persona_desires TEXT,            -- 願望・理想の状態
  persona_triggers TEXT,           -- 行動のきっかけ

  -- 何を伝えるか
  unique_features TEXT,            -- 特徴
  differentiation TEXT,            -- 差別化ポイント
  expertise TEXT,                  -- 提供ノウハウ
  transformation TEXT,             -- ビフォーアフター

  -- どんな手段で
  products_services TEXT,          -- 商品・サービス
  content_pillars TEXT,            -- コンテンツの柱
  posting_strategy TEXT,           -- 投稿戦略

  -- なぜやるのか
  background_story TEXT,           -- 背景・ストーリー
  passion TEXT,                    -- 想い・情熱
  why_now TEXT,                    -- なぜ今やるのか

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE xopt.brand_strategies ENABLE ROW LEVEL SECURITY;

-- 開発用：全てのユーザーにアクセスを許可
CREATE POLICY "Allow all" ON xopt.brand_strategies FOR ALL USING (true);

-- インデックス
CREATE INDEX idx_brand_strategies_client_id ON xopt.brand_strategies(client_id);
