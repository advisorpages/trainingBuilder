import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 45000, // 45 seconds to handle OpenAI generation requests
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup request interceptor for authentication
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Setup response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url);
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data);
  }

  async patch<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data);
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url);
  }
}

export const api = new ApiService();