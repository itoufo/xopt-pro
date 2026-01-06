import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { supabase } from '../lib/supabase';
import type { DailyLog } from '../types';
import { getProfileClickRating, getFollowRateRating } from '../types';

export function DailyLogs() {
  const { selectedClient } = useClientStore();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    post_type: 'useful',
    content: '',
    impressions: 0,
    likes: 0,
    profile_clicks: 0,
    detail_clicks: 0,
    retweets: 0,
    replies: 0,
    replies_made: 0,
    follower_count: 0,
    follower_change: 0,
    tweet_url: '',
    analytics_url: '',
  });

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // ログを取得
  useEffect(() => {
    async function fetchLogs() {
      if (!selectedClient) return;

      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('client_id', selectedClient.id)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true });

      if (error) {
        console.error('Error fetching logs:', error);
      } else if (data) {
        setLogs(data);
      }
      setLoading(false);
    }

    fetchLogs();
  }, [selectedClient, year, month]);

  const openModal = (log?: DailyLog, date?: string) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        log_date: log.log_date,
        post_type: log.post_type || 'useful',
        content: log.content || '',
        impressions: log.impressions,
        likes: log.likes,
        profile_clicks: log.profile_clicks,
        detail_clicks: log.detail_clicks,
        retweets: log.retweets,
        replies: log.replies,
        replies_made: log.replies_made,
        follower_count: log.follower_count,
        follower_change: log.follower_change,
        tweet_url: log.tweet_url || '',
        analytics_url: log.analytics_url || '',
      });
    } else {
      setEditingLog(null);
      setFormData({
        log_date: date || new Date().toISOString().split('T')[0],
        post_type: 'useful',
        content: '',
        impressions: 0,
        likes: 0,
        profile_clicks: 0,
        detail_clicks: 0,
        retweets: 0,
        replies: 0,
        replies_made: 0,
        follower_count: 0,
        follower_change: 0,
        tweet_url: '',
        analytics_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      const profileClickRate =
        formData.impressions > 0 ? (formData.profile_clicks / formData.impressions) * 100 : 0;
      const followRate =
        formData.profile_clicks > 0
          ? (formData.follower_change / formData.profile_clicks) * 100
          : 0;

      const dataToSave = {
        client_id: selectedClient.id,
        ...formData,
        profile_click_rate: profileClickRate,
        follow_rate: followRate,
      };

      if (editingLog) {
        const { data, error } = await supabase
          .from('daily_logs')
          .update(dataToSave)
          .eq('id', editingLog.id)
          .select()
          .single();
        if (error) throw error;
        setLogs((prev) => prev.map((l) => (l.id === editingLog.id ? data : l)));
      } else {
        const { data, error } = await supabase
          .from('daily_logs')
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;
        setLogs((prev) => [...prev, data].sort((a, b) => a.log_date.localeCompare(b.log_date)));
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving log:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getLogForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return logs.find((l) => l.log_date === dateStr);
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
          <h1 className="text-2xl font-bold text-gray-900">日別ログ</h1>
          <p className="mt-1 text-gray-500">パフォーマンスの記録・分析</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          新規追加
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(new Date(year, month - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {year}年{month + 1}月
          </h2>
          <button
            onClick={() => setSelectedDate(new Date(year, month + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {getDaysInMonth().map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            const log = getLogForDay(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
              2,
              '0'
            )}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <button
                key={day}
                onClick={() => (log ? openModal(log) : openModal(undefined, dateStr))}
                className={`p-2 min-h-[80px] text-left rounded-lg border transition-colors ${
                  isToday ? 'border-blue-500' : 'border-gray-200'
                } ${log ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day}
                </div>
                {log && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-xs text-gray-600">
                      imp: {log.impressions.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">
                        {getProfileClickRating(log.profile_click_rate)}
                      </span>
                      <span className="text-xs">
                        {getFollowRateRating(log.follow_rate)}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">今月のログ一覧</h3>
        {loading ? (
          <p className="text-gray-500 text-center py-8">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ログがありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">日付</th>
                <th className="text-left py-2 px-2">種類</th>
                <th className="text-right py-2 px-2">インプ</th>
                <th className="text-right py-2 px-2">いいね</th>
                <th className="text-right py-2 px-2">プロクリ</th>
                <th className="text-center py-2 px-2">プロクリ率</th>
                <th className="text-center py-2 px-2">フォロー率</th>
                <th className="text-right py-2 px-2">増加</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openModal(log)}
                >
                  <td className="py-2 px-2">{log.log_date}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        log.post_type === 'useful'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.post_type === 'useful' ? '有益' : '共感'}
                    </span>
                  </td>
                  <td className="text-right py-2 px-2">{log.impressions.toLocaleString()}</td>
                  <td className="text-right py-2 px-2">{log.likes.toLocaleString()}</td>
                  <td className="text-right py-2 px-2">{log.profile_clicks.toLocaleString()}</td>
                  <td className="text-center py-2 px-2">
                    <span className="mr-1">{getProfileClickRating(log.profile_click_rate)}</span>
                    {log.profile_click_rate.toFixed(2)}%
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className="mr-1">{getFollowRateRating(log.follow_rate)}</span>
                    {log.follow_rate.toFixed(2)}%
                  </td>
                  <td
                    className={`text-right py-2 px-2 font-medium ${
                      log.follower_change > 0
                        ? 'text-green-600'
                        : log.follower_change < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {log.follower_change > 0 ? '+' : ''}
                    {log.follower_change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold">
                {editingLog ? 'ログ編集' : '新規ログ'} - {formData.log_date}
              </h2>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">日付</label>
                    <input
                      type="date"
                      value={formData.log_date}
                      onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">種類</label>
                    <select
                      value={formData.post_type}
                      onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
                      className="input"
                    >
                      <option value="useful">有益</option>
                      <option value="empathy">共感</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">本文</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="投稿内容..."
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">インプ数</label>
                    <input
                      type="number"
                      value={formData.impressions}
                      onChange={(e) =>
                        setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">いいね数</label>
                    <input
                      type="number"
                      value={formData.likes}
                      onChange={(e) =>
                        setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">プロクリ</label>
                    <input
                      type="number"
                      value={formData.profile_clicks}
                      onChange={(e) =>
                        setFormData({ ...formData, profile_clicks: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">詳細クリック</label>
                    <input
                      type="number"
                      value={formData.detail_clicks}
                      onChange={(e) =>
                        setFormData({ ...formData, detail_clicks: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">RT数</label>
                    <input
                      type="number"
                      value={formData.retweets}
                      onChange={(e) =>
                        setFormData({ ...formData, retweets: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">リプ数</label>
                    <input
                      type="number"
                      value={formData.replies}
                      onChange={(e) =>
                        setFormData({ ...formData, replies: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">リプした数</label>
                    <input
                      type="number"
                      value={formData.replies_made}
                      onChange={(e) =>
                        setFormData({ ...formData, replies_made: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">フォロワー数</label>
                    <input
                      type="number"
                      value={formData.follower_count}
                      onChange={(e) =>
                        setFormData({ ...formData, follower_count: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">フォロワー増加数</label>
                    <input
                      type="number"
                      value={formData.follower_change}
                      onChange={(e) =>
                        setFormData({ ...formData, follower_change: parseInt(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">ツイートURL</label>
                  <input
                    type="url"
                    value={formData.tweet_url}
                    onChange={(e) => setFormData({ ...formData, tweet_url: e.target.value })}
                    className="input"
                    placeholder="https://x.com/..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                  <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
                    {loading ? '保存中...' : '保存'}
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
