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
      // Check for Google OAuth redirect query params
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get('token');
      const authErr = urlParams.get('auth_error');

      if (authErr) {
        setError(decodeURIComponent(authErr));
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      let activeToken = googleToken || localStorage.getItem('token');

      if (googleToken) {
        localStorage.setItem('token', googleToken);
        setToken(googleToken);
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      const storedUser = localStorage.getItem('user');

      if (activeToken) {
        try {
          if (storedUser && !googleToken) {
            setUser(JSON.parse(storedUser));
          }
          setToken(activeToken);

          // Verify token validity & fetch up-to-date user from backend MongoDB
          const freshUser = await authAPI.getMe();
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (err) {
          console.warn('Token is invalid or expired. Logging out.');
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
      const { token: userToken, ...userData } = data;

      setToken(userToken);
      setUser(userData);

      localStorage.setItem('token', userToken);
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
      const { token: userToken, ...userData } = data;

      setToken(userToken);
      setUser(userData);

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Sync fresh user data from backend MongoDB as single source of truth
      try {
        const freshUser = await authAPI.getMe();
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (meErr) {
        console.warn('Failed to sync getMe during login:', meErr.message);
      }

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

  // Update user profile (name, email, preferences) via backend API
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authAPI.updateProfile(profileData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Failed to update user profile:', err);
      throw err;
    }
  };

  // Update user preferences via backend API
  const updatePreferences = async (preferencesData) => {
    try {
      const res = await authAPI.updatePreferences(preferencesData);
      if (res && res.preferences) {
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          const updated = {
            ...prevUser,
            preferences: {
              ...(prevUser.preferences || {}),
              ...res.preferences,
            },
          };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
      return res;
    } catch (err) {
      console.error('Failed to update user preferences:', err);
      throw err;
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
    updateProfile,
    updatePreferences,
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
