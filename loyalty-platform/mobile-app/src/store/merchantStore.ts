import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface MerchantBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

interface MerchantMembership {
  merchantBrandId: string;
  brand: MerchantBrand;
  tierId: string;
  tierName?: string;
  availablePoints: number;
  totalPoints: number;
  lifetimePoints: number;
  joinedAt: string;
}

interface MerchantState {
  currentMerchantBrandId: string | null;
  currentMerchantBrand: MerchantBrand | null;
  myMerchants: MerchantMembership[];
  isLoading: boolean;

  setCurrentMerchant: (brandId: string | null) => Promise<void>;
  loadMyMerchants: () => Promise<void>;
  joinMerchant: (merchantBrandId: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useMerchantStore = create<MerchantState>((set, get) => ({
  currentMerchantBrandId: null,
  currentMerchantBrand: null,
  myMerchants: [],
  isLoading: false,

  initialize: async () => {
    try {
      const savedBrandId = await SecureStore.getItemAsync('currentMerchantBrandId');
      if (savedBrandId) {
        set({ currentMerchantBrandId: savedBrandId });
      }
      await get().loadMyMerchants();
      // Set the brand object for the saved ID
      if (savedBrandId) {
        const merchants = get().myMerchants;
        const match = merchants.find((m) => m.merchantBrandId === savedBrandId);
        if (match) {
          set({ currentMerchantBrand: match.brand });
        }
      }
    } catch (error) {
      console.error('Failed to initialize merchant store:', error);
    }
  },

  setCurrentMerchant: async (brandId: string | null) => {
    if (brandId) {
      await SecureStore.setItemAsync('currentMerchantBrandId', brandId);
      const merchants = get().myMerchants;
      const match = merchants.find((m) => m.merchantBrandId === brandId);
      set({
        currentMerchantBrandId: brandId,
        currentMerchantBrand: match?.brand || null,
      });
    } else {
      await SecureStore.deleteItemAsync('currentMerchantBrandId');
      set({ currentMerchantBrandId: null, currentMerchantBrand: null });
    }
  },

  loadMyMerchants: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getMyMerchants();
      set({ myMerchants: response.merchants || [], isLoading: false });
    } catch (error) {
      console.error('Failed to load merchants:', error);
      set({ isLoading: false });
    }
  },

  joinMerchant: async (merchantBrandId: string) => {
    await api.joinMerchant(merchantBrandId);
    await get().loadMyMerchants();
    await get().setCurrentMerchant(merchantBrandId);
  },
}));
