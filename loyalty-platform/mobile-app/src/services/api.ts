import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
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
  async getProfile() {
    const response = await this.api.get('/members/me');
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

  async getPointsHistory(page = 1, limit = 20) {
    const response = await this.api.get('/members/me/points', {
      params: { page, limit },
    });
    return response.data;
  }

  async getTierProgress() {
    const response = await this.api.get('/members/me/tier');
    return response.data;
  }

  // Vouchers
  async getAvailableVouchers() {
    const response = await this.api.get('/vouchers');
    return response.data;
  }

  async getMemberVouchers(status?: string) {
    const response = await this.api.get('/vouchers/member/list', {
      params: status ? { status } : {},
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

  async claimVoucher(voucherId: string) {
    const response = await this.api.post(`/vouchers/${voucherId}/claim`);
    return response.data;
  }

  // QR
  async generatePointsQR(points: number) {
    const response = await this.api.post('/qr/generate/points', { points });
    return response.data;
  }

  async generateVoucherQR(memberVoucherId: string) {
    const response = await this.api.post('/qr/generate/voucher', { memberVoucherId });
    return response.data;
  }

  async generateMembershipQR() {
    const response = await this.api.post('/qr/generate/membership');
    return response.data;
  }

  // Transactions
  async getTransactionHistory(page = 1, limit = 20) {
    const response = await this.api.get('/transactions/member/history', {
      params: { page, limit },
    });
    return response.data;
  }
}

export const api = new ApiService();
