import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);

          // Verify token validity with backend
          const freshUser = await authAPI.getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Stored token is invalid or expired. Logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register user handler
  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await authAPI.register({ name, email, password });
      const userData = { _id: data._id, name: data.name, email: data.email };

      setToken(data.token);
      setUser(userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login user handler
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authAPI.login({ email, password });
      const userData = { _id: data._id, name: data.name, email: data.email };

      setToken(data.token);
      setUser(userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout user handler
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update local user data helper
  const updateUserData = (updatedFields) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const updated = { ...prevUser, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Refresh user profile helper from backend API
  const refreshUser = async () => {
    try {
      const freshUser = await authAPI.getMe();
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      return freshUser;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateUserData,
    refreshUser,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
