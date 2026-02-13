import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const adminLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

// ── Dashboard ──
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

// ── Campaigns ──
export const getCampaigns = async () => {
  const response = await api.get('/campaigns');
  return response.data;
};

export const createCampaign = async (data: unknown) => {
  const response = await api.post('/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id: string, data: unknown) => {
  const response = await api.put(`/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id: string) => {
  const response = await api.delete(`/campaigns/${id}`);
  return response.data;
};

// ── Members ──
export const getMembers = async (params?: { page?: number; limit?: number; search?: string }) => {
  const response = await api.get('/members', { params });
  return response.data;
};

export const getMemberById = async (id: string) => {
  const response = await api.get(`/members/${id}`);
  return response.data;
};

// ── Vouchers ──
export const getVouchers = async () => {
  const response = await api.get('/vouchers');
  return response.data;
};

export const createVoucher = async (data: unknown) => {
  const response = await api.post('/vouchers', data);
  return response.data;
};

export const updateVoucher = async (id: string, data: unknown) => {
  const response = await api.put(`/vouchers/${id}`, data);
  return response.data;
};

export const deleteVoucher = async (id: string) => {
  const response = await api.delete(`/vouchers/${id}`);
  return response.data;
};

// ── Tiers ──
export const getTiers = async () => {
  const response = await api.get('/tiers');
  return response.data;
};

export const createTier = async (data: unknown) => {
  const response = await api.post('/tiers', data);
  return response.data;
};

export const updateTier = async (id: string, data: unknown) => {
  const response = await api.put(`/tiers/${id}`, data);
  return response.data;
};

// ── Settings ──
export const getSettings = async (category: string) => {
  const response = await api.get(`/settings/${category}`);
  return response.data;
};

export const updateSettings = async (category: string, data: unknown) => {
  const response = await api.put(`/settings/${category}`, data);
  return response.data;
};

// ── Transactions ──
export const getTransactions = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

// ── Reports ──
export const getRevenueReport = async (params?: { startDate?: string; endDate?: string }) => {
  const response = await api.get('/reports/revenue', { params });
  return response.data;
};

export const getMemberReport = async () => {
  const response = await api.get('/reports/members');
  return response.data;
};

// ── Merchant Brands (super admin) ──
export const getMerchantBrands = async (params?: { page?: number; limit?: number; search?: string }) => {
  const response = await api.get('/merchant-brands', { params });
  return response.data;
};

export const getMerchantBrandById = async (id: string) => {
  const response = await api.get(`/merchant-brands/${id}`);
  return response.data;
};

export const createMerchantBrand = async (data: unknown) => {
  const response = await api.post('/merchant-brands', data);
  return response.data;
};

export const updateMerchantBrand = async (id: string, data: unknown) => {
  const response = await api.put(`/merchant-brands/${id}`, data);
  return response.data;
};

export const deleteMerchantBrand = async (id: string) => {
  const response = await api.delete(`/merchant-brands/${id}`);
  return response.data;
};

// ── Outlets ──
export const getOutlets = async () => {
  const response = await api.get('/outlets');
  return response.data;
};

export const createOutlet = async (data: unknown) => {
  const response = await api.post('/outlets', data);
  return response.data;
};

export const updateOutlet = async (id: string, data: unknown) => {
  const response = await api.put(`/outlets/${id}`, data);
  return response.data;
};

export const deleteOutlet = async (id: string) => {
  const response = await api.delete(`/outlets/${id}`);
  return response.data;
};

// ── Admin Users ──
export const getAdminUsers = async () => {
  const response = await api.get('/admin-users');
  return response.data;
};

export const createAdminUser = async (data: unknown) => {
  const response = await api.post('/admin-users', data);
  return response.data;
};

export const updateAdminUser = async (id: string, data: unknown) => {
  const response = await api.put(`/admin-users/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id: string) => {
  const response = await api.delete(`/admin-users/${id}`);
  return response.data;
};

// ── Merchant Operators ──
export const getMerchantOperators = async () => {
  const response = await api.get('/merchants');
  return response.data;
};

export const createMerchantOperator = async (data: unknown) => {
  const response = await api.post('/merchants', data);
  return response.data;
};

export const updateMerchantOperator = async (id: string, data: unknown) => {
  const response = await api.put(`/merchants/${id}`, data);
  return response.data;
};

export const deleteMerchantOperator = async (id: string) => {
  const response = await api.delete(`/merchants/${id}`);
  return response.data;
};

export default api;
