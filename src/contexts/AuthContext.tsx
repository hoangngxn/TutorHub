import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TUTOR';
  fullname?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, role: 'STUDENT' | 'TUTOR') => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      await fetchProfile();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (username: string, email: string, password: string, role: 'STUDENT' | 'TUTOR') => {
    try {
      const response = await api.post('/api/auth/signup', {
        username,
        email,
        password,
        role
      });
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      await fetchProfile();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put('/api/auth/profile', data);
      setUser(response.data);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 