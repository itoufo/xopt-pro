import { useState, useEffect } from 'react';
import { Save, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { supabase } from '../lib/supabase';
import type { ProfileDesign as ProfileDesignType, TargetPersona } from '../types';

export function ProfileDesign() {
  const { selectedClient } = useClientStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileDesign, setProfileDesign] = useState<ProfileDesignType | null>(null);
  const [formData, setFormData] = useState({
    targetPersona: {
      age_range: '',
      income_range: '',
      job_title: '',
      location: '',
      situation: '',
      psychology: '',
      pain_points: '',
    },
    what_to_deliver: '',
    future_promise: '',
    achievements: '',
    career_history: '',
    profile_text: '',
    header_copy: '',
    fixed_tweet: '',
  });

  // プロフィール設計を取得
  useEffect(() => {
    async function fetchProfileDesign() {
      if (!selectedClient) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('profile_designs')
        .select('*')
        .eq('client_id', selectedClient.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile design:', error);
      }

      if (data) {
        setProfileDesign(data);
        const persona = data.target_persona ? JSON.parse(data.target_persona) : {};
        setFormData({
          targetPersona: {
            age_range: persona.age_range || '',
            income_range: persona.income_range || '',
            job_title: persona.job_title || '',
            location: persona.location || '',
            situation: persona.situation || '',
            psychology: persona.psychology || '',
            pain_points: persona.pain_points?.join('\n') || '',
          },
          what_to_deliver: data.what_to_deliver || '',
          future_promise: data.future_promise || '',
          achievements: data.achievements || '',
          career_history: data.career_history || '',
          profile_text: data.profile_text || '',
          header_copy: data.header_copy || '',
          fixed_tweet: data.fixed_tweet || '',
        });
      }
      setLoading(false);
    }

    fetchProfileDesign();
  }, [selectedClient]);

  const handleSave = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      const targetPersona: TargetPersona = {
        ...formData.targetPersona,
        pain_points: formData.targetPersona.pain_points
          .split('\n')
          .filter((p) => p.trim()),
      };

      const dataToSave = {
        client_id: selectedClient.id,
        target_persona: JSON.stringify(targetPersona),
        what_to_deliver: formData.what_to_deliver,
        future_promise: formData.future_promise,
        achievements: formData.achievements,
        career_history: formData.career_history,
        profile_text: formData.profile_text,
        header_copy: formData.header_copy,
        fixed_tweet: formData.fixed_tweet,
        updated_at: new Date().toISOString(),
      };

      if (profileDesign) {
        const { error } = await supabase
          .from('profile_designs')
          .update(dataToSave)
          .eq('id', profileDesign.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('profile_designs')
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;
        setProfileDesign(data);
      }

      alert('保存しました');
    } catch (error) {
      console.error('Error saving profile design:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const generateProfile = async () => {
    if (!selectedClient) return;

    setGenerating(true);
    try {
      // TODO: Supabase Edge Functionを呼び出してClaudeでプロフィールを生成
      const response = await supabase.functions.invoke('xopt-generate-profile', {
        body: {
          clientName: selectedClient.name,
          targetPersona: formData.targetPersona,
          whatToDeliver: formData.what_to_deliver,
          futurePromise: formData.future_promise,
          achievements: formData.achievements,
          careerHistory: formData.career_history,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.profileText) {
        setFormData((prev) => ({
          ...prev,
          profile_text: response.data.profileText,
          header_copy: response.data.headerCopy || prev.header_copy,
          fixed_tweet: response.data.fixedTweet || prev.fixed_tweet,
        }));
      }
    } catch (error) {
      console.error('Error generating profile:', error);
      alert('プロフィール生成に失敗しました。Edge Functionが設定されているか確認してください。');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedClient) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">クライアントを選択してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロフィール設計</h1>
          <p className="mt-1 text-gray-500">{selectedClient.name}のプロフィールを設計</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* ターゲット設計 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">誰に？（ターゲットペルソナ）</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">年齢層</label>
                  <input
                    type="text"
                    value={formData.targetPersona.age_range}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetPersona: { ...prev.targetPersona, age_range: e.target.value },
                      }))
                    }
                    className="input"
                    placeholder="29歳〜34歳"
                  />
                </div>
                <div>
                  <label className="label">年収帯</label>
                  <input
                    type="text"
                    value={formData.targetPersona.income_range}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetPersona: { ...prev.targetPersona, income_range: e.target.value },
                      }))
                    }
                    className="input"
                    placeholder="600万〜800万円"
                  />
                </div>
              </div>
              <div>
                <label className="label">役職・職種</label>
                <input
                  type="text"
                  value={formData.targetPersona.job_title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetPersona: { ...prev.targetPersona, job_title: e.target.value },
                    }))
                  }
                  className="input"
                  placeholder="営業マネージャー、事業責任者候補"
                />
              </div>
              <div>
                <label className="label">状況・背景</label>
                <textarea
                  value={formData.targetPersona.situation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetPersona: { ...prev.targetPersona, situation: e.target.value },
                    }))
                  }
                  className="input min-h-[80px]"
                  placeholder="プレイヤーとしては優秀だが、マネジメントで壁に..."
                />
              </div>
              <div>
                <label className="label">心理・願望</label>
                <textarea
                  value={formData.targetPersona.psychology}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetPersona: { ...prev.targetPersona, psychology: e.target.value },
                    }))
                  }
                  className="input min-h-[80px]"
                  placeholder="もっと上に行きたい、何者かになりたい..."
                />
              </div>
              <div>
                <label className="label">悩み・ペインポイント（1行ずつ）</label>
                <textarea
                  value={formData.targetPersona.pain_points}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetPersona: { ...prev.targetPersona, pain_points: e.target.value },
                    }))
                  }
                  className="input min-h-[100px]"
                  placeholder="部下が動かない&#10;忙しくて未来のための仕事ができない&#10;自分の市場価値に不安がある"
                />
              </div>
            </div>
          </div>

          {/* 何を提供するか */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">何を？（提供価値）</h2>
            <textarea
              value={formData.what_to_deliver}
              onChange={(e) => setFormData((prev) => ({ ...prev, what_to_deliver: e.target.value }))}
              className="input min-h-[120px]"
              placeholder="「数字」と「仕組み」で組織を動かすビジネスハック＆マインドを発信"
            />
          </div>

          {/* 提供できる未来 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">どんな未来？（ベネフィット）</h2>
            <textarea
              value={formData.future_promise}
              onChange={(e) => setFormData((prev) => ({ ...prev, future_promise: e.target.value }))}
              className="input min-h-[120px]"
              placeholder="思考を結果に変えるマインドが身につく&#10;市場価値の高いリーダーへ進化"
            />
          </div>

          {/* 実績 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">実績</h2>
            <textarea
              value={formData.achievements}
              onChange={(e) => setFormData((prev) => ({ ...prev, achievements: e.target.value }))}
              className="input min-h-[150px]"
              placeholder="・全国30拠点以上、従業員数数百名規模の組織トップ&#10;・2,000名以上の面接・面談実績&#10;・大阪支社長時代に業績を4〜5倍に立て直し"
            />
          </div>

          {/* 経歴 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">経歴・ストーリー</h2>
            <textarea
              value={formData.career_history}
              onChange={(e) => setFormData((prev) => ({ ...prev, career_history: e.target.value }))}
              className="input min-h-[200px]"
              placeholder="【どん底からのスタート】&#10;・大学中退&#10;・テレアポからキャリアスタート&#10;&#10;【転機】&#10;・人事部門への異動..."
            />
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-6">
          {/* AI生成ボタン */}
          <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-purple-900">AI生成</h2>
                <p className="text-sm text-purple-700">
                  左の情報を基にプロフィールを自動生成
                </p>
              </div>
              <button
                onClick={generateProfile}
                disabled={generating}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {generating ? '生成中...' : 'プロフィール生成'}
              </button>
            </div>
          </div>

          {/* ヘッダーコピー */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">ヘッダー文字</h2>
              <button
                onClick={() => copyToClipboard(formData.header_copy)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <textarea
              value={formData.header_copy}
              onChange={(e) => setFormData((prev) => ({ ...prev, header_copy: e.target.value }))}
              className="input min-h-[80px]"
              placeholder="保険業界に革新と革命を / 結果が全て。スピードは誠意。"
            />
          </div>

          {/* 完成プロフィール */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">完成プロフィール</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {formData.profile_text.length}/160文字
                </span>
                <button
                  onClick={() => copyToClipboard(formData.profile_text)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <textarea
              value={formData.profile_text}
              onChange={(e) => setFormData((prev) => ({ ...prev, profile_text: e.target.value }))}
              className="input min-h-[200px]"
              placeholder="より強く成長したいビジネスマンへ│「数字」と「仕組み」で組織を動かすビジネスハック＆マインドを発信│..."
            />
          </div>

          {/* 固定ツイート */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">固定ツイート</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {formData.fixed_tweet.length}/280文字
                </span>
                <button
                  onClick={() => copyToClipboard(formData.fixed_tweet)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <textarea
              value={formData.fixed_tweet}
              onChange={(e) => setFormData((prev) => ({ ...prev, fixed_tweet: e.target.value }))}
              className="input min-h-[200px]"
              placeholder="固定ツイートの内容..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
