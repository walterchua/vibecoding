import { create } from 'zustand';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'merchant_admin' | 'merchant_staff';
  merchantBrandId?: string;
}

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;

  login: (token: string, admin: AdminUser) => void;
  logout: () => void;

  isSuperAdmin: () => boolean;
  isMerchantAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('admin_token'),
  admin: (() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('admin_token'),

  login: (token: string, admin: AdminUser) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, admin: null, isAuthenticated: false });
  },

  isSuperAdmin: () => get().admin?.role === 'super_admin',
  isMerchantAdmin: () => {
    const role = get().admin?.role;
    return role === 'super_admin' || role === 'merchant_admin';
  },
}));
