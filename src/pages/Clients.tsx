import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, ExternalLink } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';

export function Clients() {
  const { clients, setClients, selectClient, addClient, updateClient, removeClient } = useClientStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    x_handle: '',
  });

  // Supabaseからクライアントを取得
  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
      } else if (data) {
        setClients(data);
      }
      setLoading(false);
    }

    fetchClients();
  }, [setClients]);

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, x_handle: client.x_handle || '' });
    } else {
      setEditingClient(null);
      setFormData({ name: '', x_handle: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', x_handle: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClient) {
        // 更新
        const { data, error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            x_handle: formData.x_handle || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingClient.id)
          .select()
          .single();

        if (error) throw error;
        if (data) updateClient(data);
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            x_handle: formData.x_handle || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          addClient(data);
          selectClient(data.id);
        }
      }
      closeModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`「${client.name}」を削除しますか？関連するデータも全て削除されます。`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id);
      if (error) throw error;
      removeClient(client.id);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">クライアント管理</h1>
          <p className="mt-1 text-gray-500">複数のXアカウントを管理します</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          新規追加
        </button>
      </div>

      {/* Client List */}
      {loading && clients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">クライアントがありません</p>
          <button onClick={() => openModal()} className="btn-primary mt-4">
            最初のクライアントを追加
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                  {client.x_handle && (
                    <a
                      href={`https://x.com/${client.x_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                    >
                      @{client.x_handle}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openModal(client)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">X連携</span>
                  <span className={client.x_access_token ? 'text-green-600' : 'text-gray-400'}>
                    {client.x_access_token ? '連携済み' : '未連携'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => selectClient(client.id)}
                className="mt-4 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                このクライアントを選択
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold">
                {editingClient ? 'クライアント編集' : '新規クライアント'}
              </h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label">クライアント名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="例: ミヤウチさん"
                    required
                  />
                </div>
                <div>
                  <label className="label">Xハンドル</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={formData.x_handle}
                      onChange={(e) => setFormData({ ...formData, x_handle: e.target.value })}
                      className="input pl-8"
                      placeholder="username"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading}>
                    {loading ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
