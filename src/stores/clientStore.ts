import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '../types';

interface ClientState {
  clients: Client[];
  selectedClientId: string | null;
  selectedClient: Client | null;
  setClients: (clients: Client[]) => void;
  selectClient: (clientId: string | null) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (clientId: string) => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clients: [],
      selectedClientId: null,
      selectedClient: null,

      setClients: (clients) => {
        set({ clients });
        const { selectedClientId } = get();
        if (selectedClientId) {
          const selected = clients.find((c) => c.id === selectedClientId);
          set({ selectedClient: selected || null });
        }
      },

      selectClient: (clientId) => {
        const { clients } = get();
        const selected = clientId ? clients.find((c) => c.id === clientId) : null;
        set({ selectedClientId: clientId, selectedClient: selected || null });
      },

      addClient: (client) => {
        set((state) => ({ clients: [...state.clients, client] }));
      },

      updateClient: (client) => {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === client.id ? client : c)),
          selectedClient: state.selectedClientId === client.id ? client : state.selectedClient,
        }));
      },

      removeClient: (clientId) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== clientId),
          selectedClientId: state.selectedClientId === clientId ? null : state.selectedClientId,
          selectedClient: state.selectedClientId === clientId ? null : state.selectedClient,
        }));
      },
    }),
    {
      name: 'xopt-client-storage',
      partialize: (state) => ({ selectedClientId: state.selectedClientId }),
    }
  )
);
