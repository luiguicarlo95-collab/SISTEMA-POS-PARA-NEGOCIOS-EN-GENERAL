import { create } from 'zustand';
import { apiFetch } from '../lib/api';
import { AppSettings } from '../types';

interface SettingsState {
  settings: AppSettings | null;
  setSettings: (settings: AppSettings) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  fetchSettings: async () => {
    try {
      const res = await apiFetch('/api/settings', { silent: true });
      if (res.ok) {
        const data = await res.json();
        set({ settings: data });
      }
    } catch (err) {
      console.warn('Could not fetch settings from store');
    }
  },
}));
