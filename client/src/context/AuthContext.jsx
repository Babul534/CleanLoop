import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cleanloop_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Restore authenticated session from backend using stored token
  const loadCurrentUser = useCallback(async () => {
    const existingToken = sessionStorage.getItem(TOKEN_KEY);

    if (!existingToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getCurrentUser();
      if (data && data.success && data.user) {
        setUser(data.user);
        setToken(existingToken);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      // Token invalid or expired
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCurrentUser();

    // Listen for unauthorized 401 event dispatched by api interceptor
    const handleUnauthorized = () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener('cleanloop:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('cleanloop:unauthorized', handleUnauthorized);
  }, [loadCurrentUser]);

  // Login handler
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success && data.token) {
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  // Register handler
  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.success && data.token) {
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.message || 'Registration failed');
  };

  // Logout handler
  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    loadCurrentUser
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

export default AuthContext;

