import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { LoginCredentials } from '../types/auth';
import { ROUTES } from '../constants/api';
import './AdminLoginPage.css';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: '',
    accessCode: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username || !formData.password || !formData.accessCode) {
      setFormError('All fields are required');
      return;
    }

    try {
      await login(formData);
      navigate(ROUTES.ADMIN_DASHBOARD);
    } catch (err) {
      setFormError(error || (err instanceof Error ? err.message : 'Login failed'));
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h1>Murmyz Admin</h1>
        <p className="subtitle">Staff & Admin Access</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="accessCode">Access Code</label>
            <input
              id="accessCode"
              type="password"
              name="accessCode"
              value={formData.accessCode}
              onChange={handleChange}
              placeholder="Enter your access code"
              disabled={isLoading}
              required
            />
          </div>

          {formError && <div className="error-message">{formError}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Need help? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
