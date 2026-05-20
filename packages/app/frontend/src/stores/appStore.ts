import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  notifications: Notification[];
  notify: (type: Notification['type'], message: string) => void;
  dismissNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  notifications: [],

  notify(type, message) {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ notifications: [...s.notifications, { id, type, message }] }));
    setTimeout(() => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })), 4000);
  },

  dismissNotification(id) {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },
}));
