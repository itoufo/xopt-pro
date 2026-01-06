import { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, Copy, Check, Trash2, Edit2, RefreshCw, Lightbulb, Archive, ChevronDown, ChevronUp, ImageIcon, X } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { supabase } from '../lib/supabase';
import type { PostIdea, ProfileDesign, KeywordSuggestion, BrandStrategy, PostHook, PostTemplate } from '../types';
import { categoryLabels, statusLabels, hookCategoryLabels, templateCategoryLabels, templateCategoryColors } from '../types';

export function PostIdeas() {
  const { selectedClient } = useClientStore();
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [keywordFilter, setKeywordFilter] = useState<string>('unused');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [showKeywordList, setShowKeywordList] = useState(true);
  const [editingIdea, setEditingIdea] = useState<PostIdea | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [newKeywords, setNewKeywords] = useState<Omit<KeywordSuggestion, 'id' | 'client_id' | 'status' | 'used_count' | 'created_at' | 'updated_at'>[]>([]);
  const [profileDesign, setProfileDesign] = useState<ProfileDesign | null>(null);
  const [brandStrategy, setBrandStrategy] = useState<BrandStrategy | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [hooks, setHooks] = useState<PostHook[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [isStructuredGenerateOpen, setIsStructuredGenerateOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<'simple' | 'template'>('template');
  const [structuredPrompt, setStructuredPrompt] = useState({
    theme: '',
    category: 'useful' as PostIdea['category'],
    tone: '',
    selectedHookId: null as string | null,
    selectedTemplateId: null as string | null,
    customInstructions: '',
  });
  const [generatedReplyThread, setGeneratedReplyThread] = useState<{content: string; characterCount: number}[]>([]);
  const [formData, setFormData] = useState({
    category: 'useful' as PostIdea['category'],
    title: '',
    content: '',
    tags: '',
    status: 'draft' as PostIdea['status'],
  });
  const [generatePrompt, setGeneratePrompt] = useState({
    theme: '',
    category: 'useful' as PostIdea['category'],
    tone: '',
    keywordId: null as string | null,
  });

  // プロフィール設計と全体設計を取得
  useEffect(() => {
    async function fetchProfileDesign() {
      if (!selectedClient) return;

      const { data, error } = await supabase
        .from('profile_designs')
        .select('*')
        .eq('client_id', selectedClient.id)
        .single();

      if (!error && data) {
        setProfileDesign(data);
      }
    }

    async function fetchBrandStrategy() {
      if (!selectedClient) return;

      const { data, error } = await supabase
        .from('brand_strategies')
        .select('*')
        .eq('client_id', selectedClient.id)
        .single();

      if (!error && data) {
        setBrandStrategy(data);
      } else {
        setBrandStrategy(null);
      }
    }

    fetchProfileDesign();
    fetchBrandStrategy();
    fetchHooksAndTemplates();
  }, [selectedClient]);

  // フックとテンプレートを取得
  const fetchHooksAndTemplates = async () => {
    const [hooksRes, templatesRes] = await Promise.all([
      supabase
        .from('post_hooks')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('usage_count', { ascending: false }),
      supabase
        .from('post_templates')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('usage_count', { ascending: false }),
    ]);

    if (hooksRes.data) setHooks(hooksRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
  };

  // 投稿ネタを取得
  useEffect(() => {
    async function fetchIdeas() {
      if (!selectedClient) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('post_ideas')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ideas:', error);
      } else if (data) {
        setIdeas(data);
      }
      setLoading(false);
    }

    fetchIdeas();
  }, [selectedClient]);

  // 保存済みキーワードを取得
  useEffect(() => {
    async function fetchKeywords() {
      if (!selectedClient) return;

      const { data, error } = await supabase
        .from('keyword_suggestions')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching keywords:', error);
      } else if (data) {
        setSavedKeywords(data);
      }
    }

    fetchKeywords();
  }, [selectedClient]);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || idea.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredKeywords = savedKeywords.filter((kw) => {
    if (keywordFilter === 'all') return true;
    return kw.status === keywordFilter;
  });

  const openModal = (idea?: PostIdea) => {
    if (idea) {
      setEditingIdea(idea);
      setFormData({
        category: idea.category,
        title: idea.title || '',
        content: idea.content,
        tags: idea.tags?.join(', ') || '',
        status: idea.status,
      });
    } else {
      setEditingIdea(null);
      setFormData({
        category: 'useful',
        title: '',
        content: '',
        tags: '',
        status: 'draft',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      const dataToSave = {
        client_id: selectedClient.id,
        category: formData.category,
        title: formData.title || null,
        content: formData.content,
        character_count: formData.content.length,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : null,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      if (editingIdea) {
        const { data, error } = await supabase
          .from('post_ideas')
          .update(dataToSave)
          .eq('id', editingIdea.id)
          .select()
          .single();
        if (error) throw error;
        setIdeas((prev) => prev.map((i) => (i.id === editingIdea.id ? data : i)));
      } else {
        const { data, error } = await supabase
          .from('post_ideas')
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;
        setIdeas((prev) => [data, ...prev]);

        // キーワードの使用回数を更新
        if (generatePrompt.keywordId) {
          const keyword = savedKeywords.find((k) => k.id === generatePrompt.keywordId);
          if (keyword) {
            await supabase
              .from('keyword_suggestions')
              .update({
                status: 'used',
                used_count: keyword.used_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', generatePrompt.keywordId);

            setSavedKeywords((prev) =>
              prev.map((k) =>
                k.id === generatePrompt.keywordId
                  ? { ...k, status: 'used' as const, used_count: k.used_count + 1 }
                  : k
              )
            );
          }
        }
      }

      setIsModalOpen(false);
      setGeneratePrompt((prev) => ({ ...prev, keywordId: null }));
    } catch (error) {
      console.error('Error saving idea:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idea: PostIdea) => {
    if (!confirm('この投稿ネタを削除しますか？')) return;

    try {
      const { error } = await supabase.from('post_ideas').delete().eq('id', idea.id);
      if (error) throw error;
      setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('削除に失敗しました');
    }
  };

  const generateKeywords = async () => {
    if (!selectedClient || !profileDesign) {
      alert('プロフィール設計を先に設定してください');
      return;
    }

    setGeneratingKeywords(true);
    try {
      const persona = profileDesign.target_persona ? JSON.parse(profileDesign.target_persona) : {};
      const existingKeywords = [
        ...ideas.map((i) => i.title),
        ...savedKeywords.map((k) => k.theme),
      ].filter(Boolean).join(', ');

      const response = await supabase.functions.invoke('xopt-generate-keywords', {
        body: {
          targetPersona: persona,
          whatToDeliver: profileDesign.what_to_deliver,
          futurePromise: profileDesign.future_promise,
          achievements: profileDesign.achievements,
          careerHistory: profileDesign.career_history,
          existingKeywords,
          brandStrategy: brandStrategy || undefined,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.keywords) {
        setNewKeywords(response.data.keywords);
        setIsKeywordModalOpen(true);
      }
    } catch (error) {
      console.error('Error generating keywords:', error);
      alert('キーワード生成に失敗しました。プロフィール設計を確認してください。');
    } finally {
      setGeneratingKeywords(false);
    }
  };

  const saveKeywords = async () => {
    if (!selectedClient || newKeywords.length === 0) return;

    try {
      const dataToSave = newKeywords.map((kw) => ({
        client_id: selectedClient.id,
        theme: kw.theme,
        description: kw.description,
        category: kw.category,
        hooks: kw.hooks,
        status: 'unused',
        used_count: 0,
      }));

      const { data, error } = await supabase
        .from('keyword_suggestions')
        .insert(dataToSave)
        .select();

      if (error) throw error;
      setSavedKeywords((prev) => [...data, ...prev]);
      setNewKeywords([]);
      setIsKeywordModalOpen(false);
      alert(`${data.length}件のキーワードを保存しました`);
    } catch (error) {
      console.error('Error saving keywords:', error);
      alert('キーワードの保存に失敗しました');
    }
  };

  const selectKeyword = (keyword: KeywordSuggestion | { theme: string; category: 'useful' | 'empathy'; description?: string }, isNew = false) => {
    // 両方のプロンプトに設定
    const keywordId = isNew ? null : (keyword as KeywordSuggestion).id;
    setGeneratePrompt({
      theme: keyword.theme,
      category: keyword.category,
      tone: '',
      keywordId,
    });
    setStructuredPrompt({
      theme: keyword.theme,
      category: keyword.category,
      tone: '',
      selectedHookId: null,
      selectedTemplateId: null,
      customInstructions: '',
    });
    setGenerateMode('template'); // デフォルトはテンプレート生成
    setIsKeywordModalOpen(false);
    setIsStructuredGenerateOpen(true);
  };

  const archiveKeyword = async (keyword: KeywordSuggestion) => {
    try {
      const newStatus = keyword.status === 'archived' ? 'unused' : 'archived';
      await supabase
        .from('keyword_suggestions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', keyword.id);

      setSavedKeywords((prev) =>
        prev.map((k) => (k.id === keyword.id ? { ...k, status: newStatus as KeywordSuggestion['status'] } : k))
      );
    } catch (error) {
      console.error('Error archiving keyword:', error);
    }
  };

  const deleteKeyword = async (keyword: KeywordSuggestion) => {
    if (!confirm('このキーワードを削除しますか？')) return;

    try {
      await supabase.from('keyword_suggestions').delete().eq('id', keyword.id);
      setSavedKeywords((prev) => prev.filter((k) => k.id !== keyword.id));
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  const generateIdea = async () => {
    if (!selectedClient) return;

    setGenerating(true);
    try {
      // プロフィール設計データを準備
      const profileData = profileDesign ? {
        targetPersona: profileDesign.target_persona,
        whatToDeliver: profileDesign.what_to_deliver,
        futurePromise: profileDesign.future_promise,
        achievements: profileDesign.achievements,
      } : undefined;

      const response = await supabase.functions.invoke('xopt-generate-post', {
        body: {
          clientId: selectedClient.id,
          theme: generatePrompt.theme,
          category: generatePrompt.category,
          tone: generatePrompt.tone,
          profileDesign: profileData,
          brandStrategy: brandStrategy || undefined,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.content) {
        setFormData({
          category: generatePrompt.category,
          title: response.data.title || generatePrompt.theme,
          content: response.data.content,
          tags: response.data.tags?.join(', ') || '',
          status: 'draft',
        });
        setGeneratedReplyThread([]); // シンプル生成ではリプ欄なし
        setIsStructuredGenerateOpen(false);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error generating idea:', error);
      alert('生成に失敗しました。Edge Functionが設定されているか確認してください。');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // 構文テンプレート付き生成
  const generateStructuredPost = async () => {
    if (!selectedClient) return;

    setGenerating(true);
    try {
      const profileData = profileDesign ? {
        targetPersona: profileDesign.target_persona,
        whatToDeliver: profileDesign.what_to_deliver,
        futurePromise: profileDesign.future_promise,
        achievements: profileDesign.achievements,
      } : undefined;

      const selectedHook = structuredPrompt.selectedHookId
        ? hooks.find(h => h.id === structuredPrompt.selectedHookId)
        : null;
      const selectedTemplate = structuredPrompt.selectedTemplateId
        ? templates.find(t => t.id === structuredPrompt.selectedTemplateId)
        : null;

      const response = await supabase.functions.invoke('xopt-generate-structured-post', {
        body: {
          theme: structuredPrompt.theme,
          category: structuredPrompt.category,
          tone: structuredPrompt.tone,
          profileDesign: profileData,
          brandStrategy: brandStrategy || undefined,
          selectedHook: selectedHook ? {
            hook_text: selectedHook.hook_text,
            description: selectedHook.description,
          } : undefined,
          selectedTemplate: selectedTemplate ? {
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            structure: selectedTemplate.structure,
            has_reply_thread: selectedTemplate.has_reply_thread,
            reply_structure: selectedTemplate.reply_structure,
          } : undefined,
          customInstructions: structuredPrompt.customInstructions,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.content) {
        setFormData({
          category: structuredPrompt.category,
          title: response.data.title || structuredPrompt.theme,
          content: response.data.content,
          tags: response.data.tags?.join(', ') || '',
          status: 'draft',
        });

        // リプ欄があれば保存
        if (response.data.replyThread && response.data.replyThread.length > 0) {
          setGeneratedReplyThread(response.data.replyThread);
        } else {
          setGeneratedReplyThread([]);
        }

        // フック・テンプレートの使用回数を更新
        if (selectedHook) {
          await supabase
            .from('post_hooks')
            .update({ usage_count: selectedHook.usage_count + 1 })
            .eq('id', selectedHook.id);
        }
        if (selectedTemplate) {
          await supabase
            .from('post_templates')
            .update({ usage_count: selectedTemplate.usage_count + 1 })
            .eq('id', selectedTemplate.id);
        }

        setIsStructuredGenerateOpen(false);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error generating structured post:', error);
      alert('生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const generateImage = async (idea: PostIdea) => {
    setGeneratingImageId(idea.id);
    try {
      // Edge Functionで画像生成＆Storageアップロード
      const response = await supabase.functions.invoke('xopt-generate-image', {
        body: {
          postContent: idea.content,
          ideaId: idea.id,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.imageUrl) {
        // post_ideasテーブルを更新
        const { error: updateError } = await supabase
          .from('post_ideas')
          .update({
            image_url: response.data.imageUrl,
            image_prompt: response.data.prompt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idea.id);

        if (updateError) throw updateError;

        // ローカルステートを更新
        setIdeas((prev) =>
          prev.map((i) =>
            i.id === idea.id ? { ...i, image_url: response.data.imageUrl, image_prompt: response.data.prompt } : i
          )
        );
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('画像生成に失敗しました');
    } finally {
      setGeneratingImageId(null);
    }
  };

  const deleteImage = async (idea: PostIdea) => {
    if (!idea.image_url) return;
    if (!confirm('この画像を削除しますか？')) return;

    try {
      // URLからファイル名を抽出
      const fileName = idea.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('xopt-post-images').remove([fileName]);
      }

      // データベースを更新
      await supabase
        .from('post_ideas')
        .update({
          image_url: null,
          image_prompt: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idea.id);

      // ローカルステートを更新
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id ? { ...i, image_url: undefined, image_prompt: undefined } : i
        )
      );
    } catch (error) {
      console.error('Error deleting image:', error);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">思想まとめ</h1>
          <p className="mt-1 text-gray-500">投稿ネタの管理・AI生成</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateKeywords}
            disabled={generatingKeywords}
            className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {generatingKeywords ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-2" />
            )}
            {generatingKeywords ? '生成中...' : 'キーワード生成'}
          </button>
          <button
            onClick={() => {
              setGenerateMode('template');
              setIsStructuredGenerateOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI生成
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            新規追加
          </button>
        </div>
      </div>

      {/* Saved Keywords Section */}
      {savedKeywords.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowKeywordList(!showKeywordList)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">キーワード候補一覧</h2>
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {savedKeywords.filter((k) => k.status === 'unused').length}件未使用
              </span>
            </div>
            {showKeywordList ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showKeywordList && (
            <div className="mt-4">
              <div className="flex gap-2 mb-4">
                <select
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  className="input w-auto text-sm"
                >
                  <option value="unused">未使用</option>
                  <option value="used">使用済み</option>
                  <option value="archived">アーカイブ</option>
                  <option value="all">すべて</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredKeywords.map((keyword) => (
                  <div
                    key={keyword.id}
                    className={`p-3 border rounded-lg ${
                      keyword.status === 'archived' ? 'bg-gray-50 opacity-60' : 'hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              keyword.category === 'useful'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {keyword.category === 'useful' ? '有益' : '共感'}
                          </span>
                          {keyword.used_count > 0 && (
                            <span className="text-xs text-gray-500">
                              {keyword.used_count}回使用
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm truncate">{keyword.theme}</h3>
                        {keyword.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{keyword.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => selectKeyword(keyword)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="投稿生成"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => archiveKeyword(keyword)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title={keyword.status === 'archived' ? '復元' : 'アーカイブ'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteKeyword(keyword)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="検索..."
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-auto"
            >
              <option value="all">全カテゴリ</option>
              <option value="useful">有益</option>
              <option value="empathy">共感</option>
              <option value="other">その他</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-auto"
            >
              <option value="all">全ステータス</option>
              <option value="draft">下書き</option>
              <option value="scheduled">予定</option>
              <option value="posted">投稿済み</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ideas List */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {ideas.length === 0 ? '投稿ネタがありません' : '該当する投稿ネタがありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        idea.category === 'useful'
                          ? 'bg-red-100 text-red-700'
                          : idea.category === 'empathy'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {categoryLabels[idea.category]}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        idea.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : idea.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {statusLabels[idea.status]}
                    </span>
                    <span className="text-sm text-gray-500">{idea.character_count}文字</span>
                  </div>
                  {idea.title && (
                    <h3 className="font-semibold text-gray-900 mb-2">{idea.title}</h3>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">{idea.content}</p>
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 画像表示 */}
                  {idea.image_url && (
                    <div className="mt-3 relative group">
                      <img
                        src={idea.image_url}
                        alt="投稿用画像"
                        className="rounded-lg max-h-48 object-cover"
                      />
                      {idea.image_url && (
                        <button
                          onClick={() => deleteImage(idea)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="画像を削除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => generateImage(idea)}
                    disabled={generatingImageId === idea.id}
                    className={`p-2 rounded-lg transition-colors ${
                      generatingImageId === idea.id
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title="画像生成"
                  >
                    {generatingImageId === idea.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(idea.content, idea.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="コピー"
                  >
                    {copied === idea.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openModal(idea)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(idea)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Keywords Modal */}
      {isKeywordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                新規キーワード候補（{newKeywords.length}件）
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                保存して後で使用するか、クリックして今すぐ投稿生成
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => selectKeyword(keyword, true)}
                    className="text-left p-4 border rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          keyword.category === 'useful'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {keyword.category === 'useful' ? '有益' : '共感'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{keyword.theme}</h3>
                    <p className="text-sm text-gray-600 mt-1">{keyword.description}</p>
                    {keyword.hooks && keyword.hooks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {keyword.hooks.slice(0, 2).map((hook, i) => (
                          <p key={i} className="text-xs text-purple-600">
                            "{hook}"
                          </p>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsKeywordModalOpen(false);
                    setNewKeywords([]);
                  }}
                  className="btn-secondary flex-1"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveKeywords}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  すべて保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold">
                {editingIdea ? '投稿ネタ編集' : '新規投稿ネタ'}
              </h2>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">カテゴリ</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as PostIdea['category'] })
                      }
                      className="input"
                    >
                      <option value="useful">有益</option>
                      <option value="empathy">共感</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">ステータス</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as PostIdea['status'] })
                      }
                      className="input"
                    >
                      <option value="draft">下書き</option>
                      <option value="scheduled">予定</option>
                      <option value="posted">投稿済み</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">タイトル（任意）</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="投稿のタイトル・テーマ"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">本文 *</label>
                    <span
                      className={`text-sm ${
                        formData.content.length > 280 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {formData.content.length}/280文字
                    </span>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input min-h-[200px]"
                    placeholder="投稿内容を入力..."
                    required
                  />
                </div>
                <div>
                  <label className="label">タグ（カンマ区切り）</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input"
                    placeholder="ビジネス, マインド, 経営"
                  />
                </div>

                {/* リプ欄表示 */}
                {generatedReplyThread.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="label flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      リプ欄（スレッド）
                    </label>
                    <div className="space-y-3">
                      {generatedReplyThread.map((reply, idx) => (
                        <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-green-600 font-medium">リプ {idx + 1}</span>
                            <span className="text-xs text-gray-500">{reply.characterCount}文字</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          <button
                            onClick={() => copyToClipboard(reply.content, `reply-${idx}`)}
                            className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                          >
                            {copied === `reply-${idx}` ? (
                              <><Check className="w-3 h-3" /> コピー済み</>
                            ) : (
                              <><Copy className="w-3 h-3" /> コピー</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ※ リプ欄の内容は別途コピーして投稿してください
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex-1"
                    disabled={loading || !formData.content}
                  >
                    {loading ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Generate Modal (Simple / Template) */}
      {isStructuredGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI投稿生成
              </h2>

              {/* モード切り替えタブ */}
              <div className="mt-4 flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setGenerateMode('template')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    generateMode === 'template'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  テンプレート生成
                </button>
                <button
                  onClick={() => setGenerateMode('simple')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    generateMode === 'simple'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  シンプル生成
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                {generateMode === 'template'
                  ? 'フックと構文テンプレートを選んで、効果的な投稿を生成'
                  : 'テーマとカテゴリを指定してシンプルに生成'}
              </p>

              <div className="mt-6 space-y-6">
                {/* テーマ */}
                <div>
                  <label className="label">テーマ・キーワード *</label>
                  <input
                    type="text"
                    value={generateMode === 'template' ? structuredPrompt.theme : generatePrompt.theme}
                    onChange={(e) => {
                      if (generateMode === 'template') {
                        setStructuredPrompt({ ...structuredPrompt, theme: e.target.value });
                      } else {
                        setGeneratePrompt({ ...generatePrompt, theme: e.target.value });
                      }
                    }}
                    className="input"
                    placeholder="例: スピードは誠意、仕組み化の重要性"
                  />
                </div>

                {/* カテゴリ・トーン */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">カテゴリ</label>
                    <select
                      value={generateMode === 'template' ? structuredPrompt.category : generatePrompt.category}
                      onChange={(e) => {
                        const val = e.target.value as PostIdea['category'];
                        if (generateMode === 'template') {
                          setStructuredPrompt({ ...structuredPrompt, category: val });
                        } else {
                          setGeneratePrompt({ ...generatePrompt, category: val });
                        }
                      }}
                      className="input"
                    >
                      <option value="useful">有益</option>
                      <option value="empathy">共感</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">トーン（任意）</label>
                    <input
                      type="text"
                      value={generateMode === 'template' ? structuredPrompt.tone : generatePrompt.tone}
                      onChange={(e) => {
                        if (generateMode === 'template') {
                          setStructuredPrompt({ ...structuredPrompt, tone: e.target.value });
                        } else {
                          setGeneratePrompt({ ...generatePrompt, tone: e.target.value });
                        }
                      }}
                      className="input"
                      placeholder="例: 熱い、泥臭い"
                    />
                  </div>
                </div>

                {/* テンプレートモード専用: フック選択 */}
                {generateMode === 'template' && (
                  <>
                    <div>
                      <label className="label">フック（書き出し）</label>
                      <select
                        value={structuredPrompt.selectedHookId || ''}
                        onChange={(e) => setStructuredPrompt({ ...structuredPrompt, selectedHookId: e.target.value || null })}
                        className="input"
                      >
                        <option value="">自動生成（フックを使わない）</option>
                        {hooks.map((hook) => (
                          <option key={hook.id} value={hook.id}>
                            [{hookCategoryLabels[hook.category]}] {hook.hook_text}
                          </option>
                        ))}
                      </select>
                      {structuredPrompt.selectedHookId && (
                        <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700">
                            <span className="font-medium">「{hooks.find(h => h.id === structuredPrompt.selectedHookId)?.hook_text}」</span>
                            <span className="text-purple-500 ml-2">で始まる投稿を生成します</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* テンプレート選択 */}
                    <div>
                      <label className="label">構文テンプレート</label>
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => setStructuredPrompt({ ...structuredPrompt, selectedTemplateId: null })}
                          className={`text-left p-3 border rounded-lg transition-colors ${
                            !structuredPrompt.selectedTemplateId
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="font-medium">自由形式</div>
                          <div className="text-sm text-gray-500">テンプレートなしで生成</div>
                        </button>
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setStructuredPrompt({ ...structuredPrompt, selectedTemplateId: template.id })}
                            className={`text-left p-3 border rounded-lg transition-colors ${
                              structuredPrompt.selectedTemplateId === template.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 text-xs rounded text-white"
                                style={{ backgroundColor: templateCategoryColors[template.category] }}
                              >
                                {templateCategoryLabels[template.category]}
                              </span>
                              <span className="font-medium">{template.name}</span>
                              {template.has_reply_thread && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                  リプ欄付き
                                </span>
                              )}
                            </div>
                            {template.description && (
                              <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                            )}
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {template.structure.slice(0, 4).map((part, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {part.name}
                                </span>
                              ))}
                              {template.structure.length > 4 && (
                                <span className="text-xs text-gray-400">+{template.structure.length - 4}...</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 追加指示 */}
                    <div>
                      <label className="label">追加の指示（任意）</label>
                      <textarea
                        value={structuredPrompt.customInstructions}
                        onChange={(e) => setStructuredPrompt({ ...structuredPrompt, customInstructions: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="例: 数字を多く使って、経営者目線で書いて"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsStructuredGenerateOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={generateMode === 'template' ? generateStructuredPost : generateIdea}
                    className={`flex-1 flex items-center justify-center px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      generateMode === 'template'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    disabled={generating || !(generateMode === 'template' ? structuredPrompt.theme : generatePrompt.theme)}
                  >
                    {generating ? '生成中...' : '生成する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
