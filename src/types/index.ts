// クライアント
export interface Client {
  id: string;
  name: string;
  x_handle?: string;
  x_user_id?: string;
  x_access_token?: string;
  x_refresh_token?: string;
  created_at: string;
  updated_at: string;
}

// プロフィール設計
export interface ProfileDesign {
  id: string;
  client_id: string;
  target_persona?: string; // JSON形式で保存
  what_to_deliver?: string;
  future_promise?: string;
  achievements?: string;
  career_history?: string;
  profile_text?: string;
  header_copy?: string;
  fixed_tweet?: string;
  created_at: string;
  updated_at: string;
}

// ターゲットペルソナの詳細構造
export interface TargetPersona {
  age_range?: string;
  income_range?: string;
  job_title?: string;
  location?: string;
  situation?: string;
  psychology?: string;
  pain_points?: string[];
}

// 思想まとめ（投稿ネタ）
export interface PostIdea {
  id: string;
  client_id: string;
  category: 'useful' | 'empathy' | 'other'; // 有益 / 共感 / その他
  title?: string;
  content: string;
  character_count: number;
  tags?: string[];
  status: 'draft' | 'scheduled' | 'posted';
  scheduled_at?: string;
  posted_at?: string;
  post_id?: string;
  image_url?: string;
  image_prompt?: string;
  created_at: string;
  updated_at: string;
}

// 日別ログ
export interface DailyLog {
  id: string;
  client_id: string;
  post_idea_id?: string;
  log_date: string;
  post_type?: string;
  content?: string;
  impressions: number;
  likes: number;
  profile_clicks: number;
  detail_clicks: number;
  retweets: number;
  replies: number;
  replies_made: number;
  follower_count: number;
  follower_change: number;
  profile_click_rate: number;
  follow_rate: number;
  tweet_url?: string;
  analytics_url?: string;
  created_at: string;
}

// キーワード候補
export interface KeywordSuggestion {
  id: string;
  client_id: string;
  theme: string;
  description?: string;
  category: 'useful' | 'empathy';
  hooks?: string[];
  status: 'unused' | 'used' | 'archived';
  used_count: number;
  created_at: string;
  updated_at: string;
}

// 月別サマリー
export interface MonthlySummary {
  id: string;
  client_id: string;
  year_month: string;
  tweet_count: number;
  total_impressions: number;
  total_likes: number;
  total_profile_clicks: number;
  total_detail_clicks: number;
  total_replies_received: number;
  follower_change: number;
  avg_impressions: number;
  avg_likes: number;
  avg_profile_clicks: number;
  profile_click_rate: number;
  follow_rate: number;
  created_at: string;
  updated_at: string;
}

// 評価判定の型
export type Rating = '◎' | '○' | '△' | '✕' | '💀';

// プロクリ率の評価基準
export const getProfileClickRating = (rate: number): Rating => {
  if (rate >= 5) return '◎';
  if (rate >= 3) return '○';
  if (rate >= 2) return '△';
  if (rate >= 1) return '✕';
  return '💀';
};

// フォロー率の評価基準
export const getFollowRateRating = (rate: number): Rating => {
  if (rate >= 3) return '◎';
  if (rate >= 2) return '○';
  if (rate >= 1) return '△';
  if (rate >= 0.6) return '✕';
  return '💀';
};

// カテゴリラベル
export const categoryLabels: Record<PostIdea['category'], string> = {
  useful: '有益',
  empathy: '共感',
  other: 'その他',
};

// ステータスラベル
export const statusLabels: Record<PostIdea['status'], string> = {
  draft: '下書き',
  scheduled: '予定',
  posted: '投稿済み',
};

// 全体設計（ブランド戦略）
export interface BrandStrategy {
  id: string;
  client_id: string;

  // 事業コンセプト
  mission?: string;
  vision?: string;
  values?: string;

  // 誰が（権威性・実績）
  social_proof?: string;
  authority?: string;
  achievements_detail?: string;
  career_detail?: string;

  // 誰に（ペルソナ詳細）
  persona_demographics?: string;
  persona_psychographics?: string;
  persona_pain_points?: string;
  persona_desires?: string;
  persona_triggers?: string;

  // 何を伝えるか
  unique_features?: string;
  differentiation?: string;
  expertise?: string;
  transformation?: string;

  // どんな手段で
  products_services?: string;
  content_pillars?: string;
  posting_strategy?: string;

  // なぜやるのか
  background_story?: string;
  passion?: string;
  why_now?: string;

  created_at: string;
  updated_at: string;
}

// 全体設計セクション定義
export interface BrandStrategySection {
  key: keyof Omit<BrandStrategy, 'id' | 'client_id' | 'created_at' | 'updated_at'>;
  label: string;
  description: string;
  category: 'concept' | 'who' | 'persona' | 'what' | 'how' | 'why';
}

export const brandStrategySections: BrandStrategySection[] = [
  // 事業コンセプト
  { key: 'mission', label: 'ミッション', description: '何のために存在するのか', category: 'concept' },
  { key: 'vision', label: 'ビジョン', description: '実現したい未来像', category: 'concept' },
  { key: 'values', label: '価値観', description: '大切にしている考え方', category: 'concept' },

  // 誰が
  { key: 'social_proof', label: '社会的証明', description: 'フォロワー数、実績の数値', category: 'who' },
  { key: 'authority', label: '権威性', description: '専門性を示す資格・肩書き', category: 'who' },
  { key: 'achievements_detail', label: '実績詳細', description: '具体的な成果・結果', category: 'who' },
  { key: 'career_detail', label: '経歴詳細', description: 'キャリアの詳細ストーリー', category: 'who' },

  // 誰に（ペルソナ）
  { key: 'persona_demographics', label: 'デモグラフィック', description: '年齢・性別・職業・収入', category: 'persona' },
  { key: 'persona_psychographics', label: 'サイコグラフィック', description: '心理特性・価値観・ライフスタイル', category: 'persona' },
  { key: 'persona_pain_points', label: '悩み・課題', description: '抱えている問題点', category: 'persona' },
  { key: 'persona_desires', label: '願望・理想', description: 'なりたい姿・手に入れたいもの', category: 'persona' },
  { key: 'persona_triggers', label: '行動トリガー', description: '行動を起こすきっかけ', category: 'persona' },

  // 何を伝えるか
  { key: 'unique_features', label: '特徴', description: '自分ならではの強み', category: 'what' },
  { key: 'differentiation', label: '差別化', description: '競合との違い', category: 'what' },
  { key: 'expertise', label: '提供ノウハウ', description: '教えられる専門知識', category: 'what' },
  { key: 'transformation', label: 'ビフォーアフター', description: '提供できる変化', category: 'what' },

  // どんな手段で
  { key: 'products_services', label: '商品・サービス', description: '提供している商品やサービス', category: 'how' },
  { key: 'content_pillars', label: 'コンテンツの柱', description: '発信する主要テーマ', category: 'how' },
  { key: 'posting_strategy', label: '投稿戦略', description: '投稿頻度・時間帯・形式', category: 'how' },

  // なぜやるのか
  { key: 'background_story', label: '背景ストーリー', description: 'なぜこの道を選んだか', category: 'why' },
  { key: 'passion', label: '想い・情熱', description: '心から伝えたいこと', category: 'why' },
  { key: 'why_now', label: 'なぜ今か', description: '今発信する理由', category: 'why' },
];

export const brandStrategyCategoryLabels: Record<BrandStrategySection['category'], string> = {
  concept: '事業コンセプト',
  who: '誰が（権威性・実績）',
  persona: '誰に（ペルソナ）',
  what: '何を伝えるか',
  how: 'どんな手段で',
  why: 'なぜやるのか',
};

// フックライブラリ
export interface PostHook {
  id: string;
  client_id?: string;
  category: HookCategory;
  hook_text: string;
  description?: string;
  example_usage?: string;
  usage_count: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type HookCategory = 'urgent' | 'confession' | 'limited' | 'contrast' | 'question' | 'number' | 'other';

export interface HookCategoryMaster {
  id: HookCategory;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
}

export const hookCategoryLabels: Record<HookCategory, string> = {
  urgent: '緊急・警告系',
  confession: '告白・本音系',
  limited: '限定・希少系',
  contrast: '対比・比較系',
  question: '疑問・問いかけ系',
  number: '数字・具体性系',
  other: 'その他',
};

export const hookCategoryColors: Record<HookCategory, string> = {
  urgent: '#ef4444',
  confession: '#8b5cf6',
  limited: '#f59e0b',
  contrast: '#10b981',
  question: '#3b82f6',
  number: '#ec4899',
  other: '#6b7280',
};

// 構文テンプレート
export interface PostTemplate {
  id: string;
  client_id?: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  structure: TemplateStructurePart[];
  has_reply_thread: boolean;
  reply_structure?: TemplateStructurePart[];
  usage_count: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateStructurePart {
  order: number;
  name: string;
  prompt: string;
  char_limit?: number;
}

export type TemplateCategory = 'attention' | 'empathy' | 'value' | 'story' | 'other';

export interface TemplateCategoryMaster {
  id: TemplateCategory;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
}

export const templateCategoryLabels: Record<TemplateCategory, string> = {
  attention: '注意喚起型',
  empathy: '共感型',
  value: '価値提供型',
  story: 'ストーリー型',
  other: 'その他',
};

export const templateCategoryColors: Record<TemplateCategory, string> = {
  attention: '#ef4444',
  empathy: '#8b5cf6',
  value: '#10b981',
  story: '#f59e0b',
  other: '#6b7280',
};
