import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface Member {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tier: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  points: {
    available: number;
    total: number;
    lifetime: number;
  };
  nextTier?: {
    name: string;
    pointsRequired: number;
    pointsToGo: number;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  member: Member | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  sendOTP: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (phone: string, code: string) => Promise<{ success: boolean; isNewMember: boolean; message?: string }>;
  register: (phone: string, data: { firstName?: string; lastName?: string; email?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  member: null,
  error: null,

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        const profile = await api.getProfile();
        set({ isAuthenticated: true, member: profile, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isLoading: false });
    }
  },

  sendOTP: async (phone: string) => {
    try {
      set({ error: null });
      await api.sendOTP(phone);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      set({ error: message });
      return { success: false, message };
    }
  },

  verifyOTP: async (phone: string, code: string) => {
    try {
      set({ error: null });
      const response = await api.verifyOTP(phone, code);

      if (response.isNewMember) {
        return { success: true, isNewMember: true };
      }

      await get().setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      const profile = await api.getProfile();
      set({ isAuthenticated: true, member: profile });

      return { success: true, isNewMember: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      set({ error: message });
      return { success: false, isNewMember: false, message };
    }
  },

  register: async (phone: string, data) => {
    try {
      set({ error: null });
      const response = await api.register(phone, data);

      await get().setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      const profile = await api.getProfile();
      set({ isAuthenticated: true, member: profile });

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ error: message });
      return { success: false, message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ isAuthenticated: false, member: null });
  },

  refreshProfile: async () => {
    try {
      const profile = await api.getProfile();
      set({ member: profile });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  },
}));
