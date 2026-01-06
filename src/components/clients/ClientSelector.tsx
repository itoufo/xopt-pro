import { ChevronDown, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../../stores/clientStore';

export function ClientSelector() {
  const navigate = useNavigate();
  const { clients, selectedClient, selectClient } = useClientStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="truncate">
          {selectedClient ? selectedClient.name : 'クライアントを選択'}
        </span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              クライアントがありません
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  selectClient(client.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedClient?.id === client.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="font-medium truncate">{client.name}</div>
                {client.x_handle && (
                  <div className="text-xs text-gray-500">@{client.x_handle}</div>
                )}
              </button>
            ))
          )}
          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/clients');
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規クライアント追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
