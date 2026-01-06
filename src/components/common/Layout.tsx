import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  UserCircle,
  Compass,
  Lightbulb,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { ClientSelector } from '../clients/ClientSelector';
import { useClientStore } from '../../stores/clientStore';
import { supabase } from '../../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'クライアント管理', href: '/clients', icon: Users },
  { name: 'プロフィール設計', href: '/profile', icon: UserCircle },
  { name: '全体設計', href: '/strategy', icon: Compass },
  { name: 'コンテンツライブラリ', href: '/library', icon: BookOpen },
  { name: '思想まとめ', href: '/ideas', icon: Lightbulb },
  { name: '日別ログ', href: '/logs', icon: Calendar },
  { name: '分析・ランキング', href: '/analytics', icon: BarChart3 },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clients, setClients } = useClientStore();

  // ページ読み込み時にクライアントを自動的に読み込む
  useEffect(() => {
    const loadClients = async () => {
      // すでにクライアントが読み込まれている場合はスキップ
      if (clients.length > 0) return;

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClients(data);
      }
    };

    loadClients();
  }, [clients.length, setClients]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <Link to="/" className="text-xl font-bold text-blue-600">
              X-OPT
            </Link>
          </div>

          {/* Client Selector */}
          <div className="p-4 border-b border-gray-200">
            <ClientSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/settings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              設定
            </Link>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
