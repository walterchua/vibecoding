import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch {
            await this.logout();
            throw error;
          }
        }

        throw error;
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { tokens } = response.data;
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

      this.refreshPromise = null;
      return tokens.accessToken;
    })();

    return this.refreshPromise;
  }

  private async logout() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  // Auth
  async sendOTP(phone: string) {
    const response = await this.api.post('/auth/otp/send', { phone });
    return response.data;
  }

  async verifyOTP(phone: string, code: string) {
    const response = await this.api.post('/auth/otp/verify', { phone, code });
    return response.data;
  }

  async register(phone: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
  }) {
    const response = await this.api.post('/auth/register', { phone, ...data });
    return response.data;
  }

  // Member
  async getProfile(merchantBrandId?: string) {
    const response = await this.api.get('/members/me', {
      params: merchantBrandId ? { merchantBrandId } : {},
    });
    return response.data;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
  }) {
    const response = await this.api.put('/members/me', data);
    return response.data;
  }

  async getPointsHistory(page = 1, limit = 20, merchantBrandId?: string) {
    const response = await this.api.get('/members/me/points', {
      params: { page, limit, ...(merchantBrandId ? { merchantBrandId } : {}) },
    });
    return response.data;
  }

  async getTierProgress(merchantBrandId?: string) {
    const response = await this.api.get('/members/me/tier', {
      params: merchantBrandId ? { merchantBrandId } : {},
    });
    return response.data;
  }

  // Vouchers
  async getAvailableVouchers(merchantBrandId?: string) {
    const response = await this.api.get('/vouchers', {
      params: merchantBrandId ? { merchantBrandId } : {},
    });
    return response.data;
  }

  async getMemberVouchers(status?: string, merchantBrandId?: string) {
    const response = await this.api.get('/vouchers/member/list', {
      params: {
        ...(status ? { status } : {}),
        ...(merchantBrandId ? { merchantBrandId } : {}),
      },
    });
    return response.data;
  }

  async getVoucherById(id: string) {
    const response = await this.api.get(`/vouchers/${id}`);
    return response.data;
  }

  async getMemberVoucherById(id: string) {
    const response = await this.api.get(`/vouchers/member/${id}`);
    return response.data;
  }

  async claimVoucher(voucherId: string, merchantBrandId?: string) {
    const response = await this.api.post(`/vouchers/${voucherId}/claim`, null, {
      params: merchantBrandId ? { merchantBrandId } : {},
    });
    return response.data;
  }

  // QR
  async generatePointsQR(points: number, merchantBrandId?: string) {
    const response = await this.api.post('/qr/generate/points', { points, merchantBrandId });
    return response.data;
  }

  async generateVoucherQR(memberVoucherId: string, merchantBrandId?: string) {
    const response = await this.api.post('/qr/generate/voucher', { memberVoucherId, merchantBrandId });
    return response.data;
  }

  async generateMembershipQR(merchantBrandId?: string) {
    const response = await this.api.post('/qr/generate/membership', { merchantBrandId });
    return response.data;
  }

  // Transactions
  async getTransactionHistory(page = 1, limit = 20, merchantBrandId?: string) {
    const response = await this.api.get('/transactions/member/history', {
      params: { page, limit, ...(merchantBrandId ? { merchantBrandId } : {}) },
    });
    return response.data;
  }

  // Merchant Brands (member context)
  async browseMerchants() {
    const response = await this.api.get('/member-merchants/browse');
    return response.data;
  }

  async getMyMerchants() {
    const response = await this.api.get('/member-merchants');
    return response.data;
  }

  async joinMerchant(merchantBrandId: string) {
    const response = await this.api.post(`/member-merchants/${merchantBrandId}/join`);
    return response.data;
  }

  async getMerchantProfile(merchantBrandId: string) {
    const response = await this.api.get(`/member-merchants/${merchantBrandId}`);
    return response.data;
  }
}

export const api = new ApiService();
