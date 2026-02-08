import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_ADMIN_API_KEY || 'admin-key',
  },
});

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

// Campaigns
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

// Members
export const getMembers = async (params?: { page?: number; limit?: number; search?: string }) => {
  const response = await api.get('/members', { params });
  return response.data;
};

export const getMemberById = async (id: string) => {
  const response = await api.get(`/members/${id}`);
  return response.data;
};

// Vouchers
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

// Tiers
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

// Settings
export const getSettings = async (category: string) => {
  const response = await api.get(`/settings/${category}`);
  return response.data;
};

export const updateSettings = async (category: string, data: unknown) => {
  const response = await api.put(`/settings/${category}`, data);
  return response.data;
};

// Transactions
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

// Reports
export const getRevenueReport = async (params?: { startDate?: string; endDate?: string }) => {
  const response = await api.get('/reports/revenue', { params });
  return response.data;
};

export const getMemberReport = async () => {
  const response = await api.get('/reports/members');
  return response.data;
};

export default api;
