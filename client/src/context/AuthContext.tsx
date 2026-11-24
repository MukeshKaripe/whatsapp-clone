import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/chat';
import api from '../services/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  about?: string;
}

export interface UpdateProfileData {
  name?: string;
  about?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wa_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('wa_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/auth/me');
      const userData = res.data.user;

      setUser({
        ...userData,
        avatar: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      setToken(savedToken);
    } catch {
      localStorage.removeItem('wa_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: receivedToken } = res.data;

      localStorage.setItem('wa_token', receivedToken);
      setToken(receivedToken);
      setUser({
        ...userData,
        avatar: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { user: userData, token: receivedToken } = res.data;

      localStorage.setItem('wa_token', receivedToken);
      setToken(receivedToken);
      setUser({
        ...userData,
        avatar: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('wa_token');
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data: UpdateProfileData): Promise<User> => {
    const res = await api.put('/users/profile', data);
    const userData = res.data.user;
    const formattedUser: User = {
      ...userData,
      avatar:
        userData.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    setUser(formattedUser);
    return formattedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        checkAuth,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
