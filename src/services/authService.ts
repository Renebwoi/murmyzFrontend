import type { AdminUser, LoginCredentials } from '../types/auth';
import { AUTH_ENDPOINTS, STORAGE_KEYS } from '../constants/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AdminUser> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store auth token and user data
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      localStorage.setItem(STORAGE_KEYS.ROLE, data.user.role);

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(AUTH_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearStorage();
    }
  }

  async verifyToken(): Promise<AdminUser | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(AUTH_ENDPOINTS.VERIFY, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        this.clearStorage();
        return null;
      }

      const data = await response.json();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      localStorage.setItem(STORAGE_KEYS.ROLE, data.user.role);
      return data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearStorage();
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getUser(): AdminUser | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  getRole(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ROLE);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
  }
}

export const authService = new AuthService();
