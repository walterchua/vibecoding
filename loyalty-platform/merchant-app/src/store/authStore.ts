import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface Merchant {
  id: string;
  name: string;
  email: string;
  locationId: string;
  locationName: string;
  posId: string;
  merchantBrandId: string;
  merchantBrandName: string;
  merchantBrandLogo?: string;
  outletId: string;
  outletName: string;
  role: 'admin' | 'manager' | 'cashier';
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchant: Merchant | null;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  merchant: null,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('merchantToken');
      if (token) {
        const { merchant } = await api.getProfile();
        set({ isAuthenticated: true, merchant, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('merchantToken');
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ error: null });
      const response = await api.login(email, password);

      await SecureStore.setItemAsync('merchantToken', response.tokens.accessToken);
      set({ isAuthenticated: true, merchant: response.merchant });

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message });
      return { success: false, message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('merchantToken');
    set({ isAuthenticated: false, merchant: null });
  },

  refreshProfile: async () => {
    try {
      const { merchant } = await api.getProfile();
      set({ merchant });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },
}));
