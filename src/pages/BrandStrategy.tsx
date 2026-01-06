import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Client,
  ProfileDesign,
  BrandStrategy,
  BrandStrategySection,
} from '../types';
import { brandStrategySections as sections, brandStrategyCategoryLabels as categoryLabels } from '../types';

export default function BrandStrategyPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [profileDesign, setProfileDesign] = useState<ProfileDesign | null>(null);
  const [strategy, setStrategy] = useState<Partial<BrandStrategy>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['concept', 'who', 'persona', 'what', 'how', 'why']));

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchProfileDesign();
      fetchStrategy();
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setClients(data);
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].id);
      }
    }
  };

  const fetchProfileDesign = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profile_designs')
      .select('*')
      .eq('client_id', selectedClientId)
      .single();
    setProfileDesign(data);
    setLoading(false);
  };

  const fetchStrategy = async () => {
    const { data } = await supabase
      .from('brand_strategies')
      .select('*')
      .eq('client_id', selectedClientId)
      .single();
    if (data) {
      setStrategy(data);
    } else {
      setStrategy({});
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setStrategy(prev => ({ ...prev, [key]: value }));
  };

  const saveStrategy = async () => {
    if (!selectedClientId) return;
    setSaving(true);

    const payload = {
      client_id: selectedClientId,
      ...strategy,
      updated_at: new Date().toISOString(),
    };

    if (strategy.id) {
      await supabase
        .from('brand_strategies')
        .update(payload)
        .eq('id', strategy.id);
    } else {
      const { data } = await supabase
        .from('brand_strategies')
        .insert(payload)
        .select()
        .single();
      if (data) {
        setStrategy(data);
      }
    }
    setSaving(false);
  };

  const generateField = async (section: BrandStrategySection) => {
    if (!profileDesign) {
      alert('プロフィール設計が必要です。先にプロフィール設計を行ってください。');
      return;
    }

    setGeneratingField(section.key);

    try {
      const response = await supabase.functions.invoke('xopt-generate-strategy-section', {
        body: {
          sectionKey: section.key,
          sectionLabel: section.label,
          sectionDescription: section.description,
          sectionCategory: section.category,
          profileDesign: {
            targetPersona: profileDesign.target_persona,
            whatToDeliver: profileDesign.what_to_deliver,
            futurePromise: profileDesign.future_promise,
            achievements: profileDesign.achievements,
            careerHistory: profileDesign.career_history,
          },
          existingStrategy: strategy,
        },
      });

      if (response.data?.content) {
        handleFieldChange(section.key, response.data.content);
      }
    } catch (error) {
      console.error('生成エラー:', error);
      alert('生成に失敗しました');
    }

    setGeneratingField(null);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getSectionsByCategory = (category: string) => {
    return sections.filter(s => s.category === category);
  };

  const categories = ['concept', 'who', 'persona', 'what', 'how', 'why'] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">全体設計</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <button
            onClick={saveStrategy}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {!profileDesign && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            このクライアントにはプロフィール設計がありません。
            AI生成機能を使用するには、先にプロフィール設計を行ってください。
          </p>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {categoryLabels[category]}
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedCategories.has(category) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedCategories.has(category) && (
              <div className="p-6 space-y-6">
                {getSectionsByCategory(category).map((section) => (
                  <div key={section.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {section.label}
                        </label>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                      <button
                        onClick={() => generateField(section)}
                        disabled={generatingField === section.key || !profileDesign}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {generatingField === section.key ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            生成中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI生成
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={(strategy[section.key as keyof BrandStrategy] as string) || ''}
                      onChange={(e) => handleFieldChange(section.key, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                      placeholder={`${section.label}を入力...`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">プロフィール設計からの情報</h3>
        {profileDesign ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ターゲット:</span>
              <p className="text-gray-900 truncate">{profileDesign.target_persona || '未設定'}</p>
            </div>
            <div>
              <span className="text-gray-500">提供価値:</span>
              <p className="text-gray-900 truncate">{profileDesign.what_to_deliver || '未設定'}</p>
            </div>
            <div>
              <span className="text-gray-500">実績:</span>
              <p className="text-gray-900 truncate">{profileDesign.achievements || '未設定'}</p>
            </div>
            <div>
              <span className="text-gray-500">経歴:</span>
              <p className="text-gray-900 truncate">{profileDesign.career_history || '未設定'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">プロフィール設計がありません</p>
        )}
      </div>
    </div>
  );
}
