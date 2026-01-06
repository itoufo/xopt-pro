import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, BarChart3 } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { supabase } from '../lib/supabase';
import type { DailyLog, MonthlySummary } from '../types';
import { getProfileClickRating, getFollowRateRating } from '../types';

export function Analytics() {
  const { selectedClient } = useClientStore();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);

  // データ取得
  useEffect(() => {
    async function fetchData() {
      if (!selectedClient) return;

      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      // 日別ログを取得
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('client_id', selectedClient.id)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('impressions', { ascending: false });

      if (logsError) {
        console.error('Error fetching logs:', logsError);
      } else if (logsData) {
        setLogs(logsData);

        // サマリーを計算
        if (logsData.length > 0) {
          const total = logsData.reduce(
            (acc, log) => ({
              impressions: acc.impressions + log.impressions,
              likes: acc.likes + log.likes,
              profile_clicks: acc.profile_clicks + log.profile_clicks,
              detail_clicks: acc.detail_clicks + log.detail_clicks,
              replies: acc.replies + log.replies,
              follower_change: acc.follower_change + log.follower_change,
            }),
            { impressions: 0, likes: 0, profile_clicks: 0, detail_clicks: 0, replies: 0, follower_change: 0 }
          );

          setSummary({
            id: '',
            client_id: selectedClient.id,
            year_month: selectedMonth,
            tweet_count: logsData.length,
            total_impressions: total.impressions,
            total_likes: total.likes,
            total_profile_clicks: total.profile_clicks,
            total_detail_clicks: total.detail_clicks,
            total_replies_received: total.replies,
            follower_change: total.follower_change,
            avg_impressions: total.impressions / logsData.length,
            avg_likes: total.likes / logsData.length,
            avg_profile_clicks: total.profile_clicks / logsData.length,
            profile_click_rate: total.impressions > 0 ? (total.profile_clicks / total.impressions) * 100 : 0,
            follow_rate: total.profile_clicks > 0 ? (total.follower_change / total.profile_clicks) * 100 : 0,
            created_at: '',
            updated_at: '',
          });
        } else {
          setSummary(null);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [selectedClient, selectedMonth]);

  // ランキング用のソート
  const topImpressions = [...logs].sort((a, b) => b.impressions - a.impressions).slice(0, 5);
  const topLikes = [...logs].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const topProfileClicks = [...logs].sort((a, b) => b.profile_clicks - a.profile_clicks).slice(0, 5);
  const topFollowerChange = [...logs].sort((a, b) => b.follower_change - a.follower_change).slice(0, 5);

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
          <h1 className="text-2xl font-bold text-gray-900">分析・ランキング</h1>
          <p className="mt-1 text-gray-500">月次サマリーとパフォーマンスランキング</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input w-auto"
        />
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : !summary ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">この月のデータがありません</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500">ツイート数</p>
              <p className="text-2xl font-bold">{summary.tweet_count}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">合計インプ</p>
              <p className="text-2xl font-bold">{summary.total_impressions.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">合計いいね</p>
              <p className="text-2xl font-bold">{summary.total_likes.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">合計プロクリ</p>
              <p className="text-2xl font-bold">{summary.total_profile_clicks.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">プロクリ率</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getProfileClickRating(summary.profile_click_rate)}</span>
                <span className="text-2xl font-bold">{summary.profile_click_rate.toFixed(2)}%</span>
              </div>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">フォロワー増加</p>
              <div className="flex items-center gap-2">
                {summary.follower_change > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : summary.follower_change < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : null}
                <span
                  className={`text-2xl font-bold ${
                    summary.follower_change > 0
                      ? 'text-green-600'
                      : summary.follower_change < 0
                      ? 'text-red-600'
                      : ''
                  }`}
                >
                  {summary.follower_change > 0 ? '+' : ''}
                  {summary.follower_change}
                </span>
              </div>
            </div>
          </div>

          {/* Average Cards */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">平均値</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">平均インプ</p>
                <p className="text-xl font-bold">{Math.round(summary.avg_impressions).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">平均いいね</p>
                <p className="text-xl font-bold">{Math.round(summary.avg_likes).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">平均プロクリ</p>
                <p className="text-xl font-bold">{Math.round(summary.avg_profile_clicks).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">フォロー率</p>
                <div className="flex items-center gap-2">
                  <span>{getFollowRateRating(summary.follow_rate)}</span>
                  <span className="text-xl font-bold">{summary.follow_rate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impressions Ranking */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">インプレッションBest5</h2>
              </div>
              {topImpressions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {topImpressions.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                          i === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : i === 1
                            ? 'bg-gray-200 text-gray-700'
                            : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {log.content || log.log_date}
                        </p>
                        <p className="text-lg font-bold">{log.impressions.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Likes Ranking */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold">いいねBest5</h2>
              </div>
              {topLikes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {topLikes.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                          i === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : i === 1
                            ? 'bg-gray-200 text-gray-700'
                            : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {log.content || log.log_date}
                        </p>
                        <p className="text-lg font-bold">{log.likes.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Clicks Ranking */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">プロクリBest5</h2>
              </div>
              {topProfileClicks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {topProfileClicks.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                          i === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : i === 1
                            ? 'bg-gray-200 text-gray-700'
                            : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {log.content || log.log_date}
                        </p>
                        <p className="text-lg font-bold">{log.profile_clicks.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follower Change Ranking */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">フォロワー増加Best5</h2>
              </div>
              {topFollowerChange.length === 0 ? (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {topFollowerChange.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                          i === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : i === 1
                            ? 'bg-gray-200 text-gray-700'
                            : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {log.content || log.log_date}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          +{log.follower_change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
