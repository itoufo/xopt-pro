import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
  PostHook,
  PostTemplate,
  HookCategory,
  TemplateCategory,
} from '../types';
import {
  hookCategoryLabels,
  hookCategoryColors,
  templateCategoryLabels,
  templateCategoryColors,
} from '../types';

type TabType = 'hooks' | 'templates';

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState<TabType>('hooks');
  const [hooks, setHooks] = useState<PostHook[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHookCategory, setSelectedHookCategory] = useState<HookCategory | 'all'>('all');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TemplateCategory | 'all'>('all');

  // モーダル用の状態
  const [showHookModal, setShowHookModal] = useState(false);
  const [editingHook, setEditingHook] = useState<Partial<PostHook> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchHooks(), fetchTemplates()]);
    setLoading(false);
  };

  const fetchHooks = async () => {
    const { data } = await supabase
      .from('post_hooks')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('usage_count', { ascending: false });
    if (data) setHooks(data);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('post_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('usage_count', { ascending: false });
    if (data) setTemplates(data);
  };

  const filteredHooks = selectedHookCategory === 'all'
    ? hooks
    : hooks.filter(h => h.category === selectedHookCategory);

  const filteredTemplates = selectedTemplateCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedTemplateCategory);

  const hookCategories: HookCategory[] = ['urgent', 'confession', 'limited', 'contrast', 'question', 'number', 'other'];
  const templateCategories: TemplateCategory[] = ['attention', 'empathy', 'value', 'story', 'other'];

  const saveHook = async () => {
    if (!editingHook?.hook_text) return;

    if (editingHook.id) {
      await supabase
        .from('post_hooks')
        .update({
          hook_text: editingHook.hook_text,
          category: editingHook.category,
          description: editingHook.description,
        })
        .eq('id', editingHook.id);
    } else {
      await supabase
        .from('post_hooks')
        .insert({
          hook_text: editingHook.hook_text,
          category: editingHook.category || 'other',
          description: editingHook.description,
          is_system: false,
        });
    }

    setShowHookModal(false);
    setEditingHook(null);
    fetchHooks();
  };

  const deleteHook = async (id: string) => {
    if (!confirm('このフックを削除しますか？')) return;
    await supabase.from('post_hooks').update({ is_active: false }).eq('id', id);
    fetchHooks();
  };

  const incrementHookUsage = async (id: string) => {
    const hook = hooks.find(h => h.id === id);
    if (!hook) return;

    // 直接更新
    await supabase
      .from('post_hooks')
      .update({ usage_count: hook.usage_count + 1 })
      .eq('id', id);
  };

  const copyHookToClipboard = async (hook: PostHook) => {
    await navigator.clipboard.writeText(hook.hook_text);
    incrementHookUsage(hook.id);
    // トースト表示など
  };

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
        <h1 className="text-2xl font-bold text-gray-900">コンテンツライブラリ</h1>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('hooks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            フックライブラリ
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              {hooks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            構文テンプレート
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              {templates.length}
            </span>
          </button>
        </nav>
      </div>

      {/* フックライブラリ */}
      {activeTab === 'hooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedHookCategory('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedHookCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {hookCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedHookCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedHookCategory === cat
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={selectedHookCategory === cat ? { backgroundColor: hookCategoryColors[cat] } : {}}
                >
                  {hookCategoryLabels[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setEditingHook({ category: 'other', hook_text: '' });
                setShowHookModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + フック追加
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHooks.map((hook) => (
              <div
                key={hook.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: hookCategoryColors[hook.category] }}
                  >
                    {hookCategoryLabels[hook.category]}
                  </span>
                  {hook.is_system && (
                    <span className="text-xs text-gray-400">システム</span>
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  「{hook.hook_text}」
                </p>
                {hook.description && (
                  <p className="text-sm text-gray-500 mb-3">{hook.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    使用: {hook.usage_count}回
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyHookToClipboard(hook)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      コピー
                    </button>
                    {!hook.is_system && (
                      <>
                        <button
                          onClick={() => {
                            setEditingHook(hook);
                            setShowHookModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteHook(hook.id)}
                          className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          削除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 構文テンプレート */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTemplateCategory('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTemplateCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {templateCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedTemplateCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTemplateCategory === cat
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={selectedTemplateCategory === cat ? { backgroundColor: templateCategoryColors[cat] } : {}}
                >
                  {templateCategoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                  </div>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: templateCategoryColors[template.category] }}
                  >
                    {templateCategoryLabels[template.category]}
                  </span>
                </div>

                {/* 構成フロー */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">本文構成</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {template.structure.map((part, idx) => (
                      <div key={idx} className="flex items-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {part.name}
                        </span>
                        {idx < template.structure.length - 1 && (
                          <svg className="w-4 h-4 text-gray-300 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* リプ欄構成 */}
                {template.has_reply_thread && template.reply_structure && (
                  <div className="mb-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">リプ欄構成</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {template.reply_structure.map((part, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                            {part.name}
                          </span>
                          {idx < template.reply_structure!.length - 1 && (
                            <svg className="w-4 h-4 text-gray-300 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      使用: {template.usage_count}回
                    </span>
                    {template.has_reply_thread && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        リプ欄付き
                      </span>
                    )}
                  </div>
                  {template.is_system && (
                    <span className="text-xs text-gray-400">システム</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フック編集モーダル */}
      {showHookModal && editingHook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingHook.id ? 'フックを編集' : '新しいフックを追加'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={editingHook.category || 'other'}
                  onChange={(e) => setEditingHook({ ...editingHook, category: e.target.value as HookCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {hookCategories.map((cat) => (
                    <option key={cat} value={cat}>{hookCategoryLabels[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フックテキスト
                </label>
                <input
                  type="text"
                  value={editingHook.hook_text || ''}
                  onChange={(e) => setEditingHook({ ...editingHook, hook_text: e.target.value })}
                  placeholder="例: 実は..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <input
                  type="text"
                  value={editingHook.description || ''}
                  onChange={(e) => setEditingHook({ ...editingHook, description: e.target.value })}
                  placeholder="このフックの効果や使い方"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowHookModal(false);
                  setEditingHook(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={saveHook}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
