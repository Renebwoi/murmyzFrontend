export type UserRole = 'boss' | 'admin' | 'vip-master' | 'bar-master' | 'receptionist';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accessCode: string;
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  accessCode: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
