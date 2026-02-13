import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.86.201:3000/api';

class MerchantApiService {
  private api: AxiosInstance;

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
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('merchantToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await SecureStore.deleteItemAsync('merchantToken');
        }
        throw error;
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.api.post('/merchant/login', { email, password });
    return response.data;
  }

  // Profile
  async getProfile() {
    const response = await this.api.get('/merchant/profile');
    return response.data;
  }

  // Dashboard
  async getDashboard() {
    const response = await this.api.get('/merchant/dashboard');
    return response.data;
  }

  // Transactions
  async getTransactions(page = 1, limit = 20) {
    const response = await this.api.get('/merchant/transactions', {
      params: { page, limit },
    });
    return response.data;
  }

  // Scan QR - validate
  async scanQR(token: string) {
    const response = await this.api.post('/merchant/scan', { token });
    return response.data;
  }

  // Consume QR - redeem points/voucher
  async consumeQR(token: string) {
    const response = await this.api.post('/merchant/consume', { token });
    return response.data;
  }

  // Create transaction
  async createTransaction(data: {
    memberId?: string;
    memberPhone?: string;
    amount: number;
    paymentMethod?: string;
  }) {
    const response = await this.api.post('/merchant/transaction', data);
    return response.data;
  }

  // Lookup member by phone
  async lookupMember(phone: string) {
    const response = await this.api.get('/merchant/lookup-member', {
      params: { phone },
    });
    return response.data;
  }
}

export const api = new MerchantApiService();
