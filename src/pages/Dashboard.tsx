import { useClientStore } from '../stores/clientStore';
import { Users, UserCircle, Lightbulb, Calendar, BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { selectedClient, clients } = useClientStore();

  const features = [
    {
      name: 'クライアント管理',
      description: '複数のXアカウントを管理',
      href: '/clients',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'プロフィール設計',
      description: 'ターゲット設計・プロフィール作成',
      href: '/profile',
      icon: UserCircle,
      color: 'bg-purple-500',
    },
    {
      name: '思想まとめ',
      description: '投稿ネタの管理・AI生成',
      href: '/ideas',
      icon: Lightbulb,
      color: 'bg-yellow-500',
    },
    {
      name: '日別ログ',
      description: 'パフォーマンス記録・分析',
      href: '/logs',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: '分析・ランキング',
      description: '月次サマリー・Best5ランキング',
      href: '/analytics',
      icon: BarChart3,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-gray-500">
          Xコンサルティングツールへようこそ
        </p>
      </div>

      {/* Stats */}
      {selectedClient ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            現在のクライアント: {selectedClient.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Xハンドル</p>
              <p className="text-xl font-bold text-blue-900">
                {selectedClient.x_handle ? `@${selectedClient.x_handle}` : '未設定'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">登録日</p>
              <p className="text-xl font-bold text-green-900">
                {new Date(selectedClient.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">X連携</p>
              <p className="text-xl font-bold text-purple-900">
                {selectedClient.x_access_token ? '連携済み' : '未連携'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            サイドバーからクライアントを選択してください。
            {clients.length === 0 && 'まず、クライアントを作成してください。'}
          </p>
          {clients.length === 0 && (
            <Link to="/clients" className="btn-primary inline-flex items-center mt-4">
              クライアントを作成
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>
      )}

      {/* Feature Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">機能一覧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className={`${feature.color} p-3 rounded-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
