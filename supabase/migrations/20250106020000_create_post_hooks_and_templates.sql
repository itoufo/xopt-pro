-- フックライブラリ（書き出し50選など）
CREATE TABLE IF NOT EXISTS xopt.post_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES xopt.clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- '緊急・警告系', '告白・本音系', '限定・希少系', '対比・比較系', '疑問・問いかけ系', '数字・具体性系', 'その他'
  hook_text TEXT NOT NULL, -- 「実は...」「正直に言うと...」など
  description TEXT, -- このフックの効果説明
  example_usage TEXT, -- 使用例
  usage_count INTEGER DEFAULT 0, -- 使用回数
  is_system BOOLEAN DEFAULT false, -- システム提供のデフォルトフック
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 構文テンプレート（投稿の構成パターン）
CREATE TABLE IF NOT EXISTS xopt.post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES xopt.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 「不安煽り型」「共感→解決型」など
  description TEXT, -- テンプレートの説明
  category TEXT NOT NULL, -- 'attention', 'empathy', 'value', 'story', 'other'

  -- 構成要素（各パートのプロンプト指示）
  structure JSONB NOT NULL DEFAULT '[]', -- [{order: 1, name: "不安を煽る", prompt: "...", char_limit: 50}, ...]

  -- リプ欄用の追加構成
  has_reply_thread BOOLEAN DEFAULT false,
  reply_structure JSONB, -- リプ欄の構成

  -- メタデータ
  usage_count INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- フックカテゴリのマスタ
CREATE TABLE IF NOT EXISTS xopt.hook_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- UIでの色
  icon TEXT, -- アイコン名
  sort_order INTEGER DEFAULT 0
);

-- テンプレートカテゴリのマスタ
CREATE TABLE IF NOT EXISTS xopt.template_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- デフォルトのフックカテゴリを挿入
INSERT INTO xopt.hook_categories (id, name, description, color, sort_order) VALUES
  ('urgent', '緊急・警告系', '危機感や緊急性を伝えるフック', '#ef4444', 1),
  ('confession', '告白・本音系', '本音や秘密を明かすフック', '#8b5cf6', 2),
  ('limited', '限定・希少系', '限定感や希少価値を伝えるフック', '#f59e0b', 3),
  ('contrast', '対比・比較系', 'ビフォーアフターや比較のフック', '#10b981', 4),
  ('question', '疑問・問いかけ系', '読者に問いかけるフック', '#3b82f6', 5),
  ('number', '数字・具体性系', '具体的な数字で説得力を持たせるフック', '#ec4899', 6),
  ('other', 'その他', 'その他のフック', '#6b7280', 99)
ON CONFLICT (id) DO NOTHING;

-- デフォルトのテンプレートカテゴリを挿入
INSERT INTO xopt.template_categories (id, name, description, color, sort_order) VALUES
  ('attention', '注意喚起型', '不安を煽り、解決策を提示する構成', '#ef4444', 1),
  ('empathy', '共感型', '共感から入り信頼を築く構成', '#8b5cf6', 2),
  ('value', '価値提供型', '有益情報を直接提供する構成', '#10b981', 3),
  ('story', 'ストーリー型', '体験談やストーリーで伝える構成', '#f59e0b', 4),
  ('other', 'その他', 'その他の構成パターン', '#6b7280', 99)
ON CONFLICT (id) DO NOTHING;

-- システムデフォルトのフックを挿入（書き出し50選ベース）
INSERT INTO xopt.post_hooks (client_id, category, hook_text, description, is_system) VALUES
  -- 緊急・警告系
  (NULL, 'urgent', '実は...', '意外性を持たせて注目を集める', true),
  (NULL, 'urgent', '知らないとヤバい', '危機感を煽って読ませる', true),
  (NULL, 'urgent', '今すぐやめて', '緊急性で行動を促す', true),
  (NULL, 'urgent', '絶対にやってはいけない', '禁止形で興味を引く', true),
  (NULL, 'urgent', '要注意！', 'シンプルな警告で目を引く', true),
  (NULL, 'urgent', '危険信号です', '危機感を伝える', true),
  (NULL, 'urgent', '見逃し厳禁', '重要性を強調', true),

  -- 告白・本音系
  (NULL, 'confession', '正直に言うと...', '本音感で信頼を得る', true),
  (NULL, 'confession', 'ぶっちゃけ', 'カジュアルな本音トーン', true),
  (NULL, 'confession', '本当のことを言います', '誠実さをアピール', true),
  (NULL, 'confession', '言いにくいけど...', '勇気ある告白感', true),
  (NULL, 'confession', '実体験から言うと', '経験に基づく説得力', true),
  (NULL, 'confession', '失敗談ですが', '弱みを見せて共感を得る', true),

  -- 限定・希少系
  (NULL, 'limited', '今だけ公開', '限定感で価値を高める', true),
  (NULL, 'limited', 'ここだけの話', '特別感を演出', true),
  (NULL, 'limited', '知る人ぞ知る', '希少性を強調', true),
  (NULL, 'limited', 'あまり知られていない', '情報の価値を高める', true),
  (NULL, 'limited', '業界の裏話', '内部情報感で興味を引く', true),

  -- 対比・比較系
  (NULL, 'contrast', '〇〇する人、しない人', '二択で読者を巻き込む', true),
  (NULL, 'contrast', '1年前の私→今の私', 'ビフォーアフターで説得', true),
  (NULL, 'contrast', '成功する人の特徴', 'なりたい姿を提示', true),
  (NULL, 'contrast', '伸びる人と伸びない人の違い', '差別化ポイントを示す', true),

  -- 疑問・問いかけ系
  (NULL, 'question', 'なぜ〇〇なのか？', '疑問形で考えさせる', true),
  (NULL, 'question', '〇〇できていますか？', '自己チェックを促す', true),
  (NULL, 'question', 'こんな経験ありませんか？', '共感を呼ぶ問いかけ', true),
  (NULL, 'question', '本当にそれでいいの？', '疑問を投げかける', true),

  -- 数字・具体性系
  (NULL, 'number', '〇〇を3ヶ月続けた結果', '期間で具体性を出す', true),
  (NULL, 'number', '年収〇〇万円になった方法', '数字で説得力', true),
  (NULL, 'number', '5つの習慣', 'リスト形式で読みやすく', true),
  (NULL, 'number', '90%の人が知らない', '割合で希少性を演出', true),
  (NULL, 'number', 'たった1つの', 'シンプルさを強調', true)
ON CONFLICT DO NOTHING;

-- システムデフォルトの構文テンプレートを挿入
INSERT INTO xopt.post_templates (client_id, name, description, category, structure, has_reply_thread, reply_structure, is_system) VALUES
  (NULL, '不安煽り→解決型', '不安を煽ってから解決策をリプ欄で提示する構成', 'attention',
   '[
     {"order": 1, "name": "フック", "prompt": "注目を集める書き出し（フックライブラリから選択）", "char_limit": 30},
     {"order": 2, "name": "不安を煽る", "prompt": "読者が抱える問題や不安を具体的に描写する", "char_limit": 60},
     {"order": 3, "name": "問題提起", "prompt": "なぜその問題が起きるのか、原因を指摘する", "char_limit": 50},
     {"order": 4, "name": "注意喚起", "prompt": "放置するとどうなるか、リスクを伝える", "char_limit": 50},
     {"order": 5, "name": "解決匂わせ", "prompt": "解決策があることを匂わせてリプ欄へ誘導", "char_limit": 30}
   ]'::jsonb,
   true,
   '[
     {"order": 1, "name": "解決策", "prompt": "具体的な解決方法を3-5ステップで説明", "char_limit": 200},
     {"order": 2, "name": "実践アドバイス", "prompt": "今日からできる具体的なアクション", "char_limit": 100}
   ]'::jsonb,
   true),

  (NULL, '共感→価値提供型', '共感から入り有益情報を提供する構成', 'empathy',
   '[
     {"order": 1, "name": "共感フック", "prompt": "読者の悩みや状況に共感する書き出し", "char_limit": 40},
     {"order": 2, "name": "体験共有", "prompt": "自分も同じ経験をしたことを伝える", "char_limit": 60},
     {"order": 3, "name": "転機", "prompt": "何がきっかけで変わったか", "char_limit": 50},
     {"order": 4, "name": "学び", "prompt": "そこから得た教訓やノウハウ", "char_limit": 70}
   ]'::jsonb,
   false,
   NULL,
   true),

  (NULL, 'リスト型（価値提供）', '具体的なリストで有益情報を提供', 'value',
   '[
     {"order": 1, "name": "タイトル", "prompt": "〇〇する5つの方法、など数字入りタイトル", "char_limit": 30},
     {"order": 2, "name": "リスト項目", "prompt": "具体的なポイントを箇条書き", "char_limit": 150},
     {"order": 3, "name": "まとめ", "prompt": "行動を促す締めの一言", "char_limit": 40}
   ]'::jsonb,
   false,
   NULL,
   true),

  (NULL, 'ビフォーアフター型', '変化のストーリーで説得する構成', 'story',
   '[
     {"order": 1, "name": "過去の状態", "prompt": "以前はどんな状態だったか（ネガティブ）", "char_limit": 50},
     {"order": 2, "name": "転機・きっかけ", "prompt": "何が変わるきっかけになったか", "char_limit": 50},
     {"order": 3, "name": "行動・実践", "prompt": "具体的に何をしたか", "char_limit": 60},
     {"order": 4, "name": "現在の状態", "prompt": "今はどうなったか（ポジティブ）", "char_limit": 50},
     {"order": 5, "name": "教訓", "prompt": "この経験から言えること", "char_limit": 30}
   ]'::jsonb,
   false,
   NULL,
   true)
ON CONFLICT DO NOTHING;

-- RLSポリシー
ALTER TABLE xopt.post_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE xopt.post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE xopt.hook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE xopt.template_categories ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがシステムフック/テンプレートを読める
CREATE POLICY "Anyone can read system hooks" ON xopt.post_hooks
  FOR SELECT USING (is_system = true OR client_id IS NOT NULL);

CREATE POLICY "Anyone can read system templates" ON xopt.post_templates
  FOR SELECT USING (is_system = true OR client_id IS NOT NULL);

CREATE POLICY "Anyone can read hook categories" ON xopt.hook_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read template categories" ON xopt.template_categories
  FOR SELECT USING (true);

-- クライアント固有のフック/テンプレートの管理
CREATE POLICY "Clients can manage their hooks" ON xopt.post_hooks
  FOR ALL USING (client_id IS NOT NULL);

CREATE POLICY "Clients can manage their templates" ON xopt.post_templates
  FOR ALL USING (client_id IS NOT NULL);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_post_hooks_category ON xopt.post_hooks(category);
CREATE INDEX IF NOT EXISTS idx_post_hooks_client ON xopt.post_hooks(client_id);
CREATE INDEX IF NOT EXISTS idx_post_hooks_active ON xopt.post_hooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_post_templates_category ON xopt.post_templates(category);
CREATE INDEX IF NOT EXISTS idx_post_templates_client ON xopt.post_templates(client_id);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION xopt.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_hooks_updated_at
  BEFORE UPDATE ON xopt.post_hooks
  FOR EACH ROW EXECUTE FUNCTION xopt.update_updated_at();

CREATE TRIGGER update_post_templates_updated_at
  BEFORE UPDATE ON xopt.post_templates
  FOR EACH ROW EXECUTE FUNCTION xopt.update_updated_at();
