import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // State to hold the token
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      // Set default auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token, ...userData } = response.data;

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setToken(token);
      setUser(userData);

      // Set default auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return response.data;
    } catch (error) {
      // 401 = بيانات خاطئة عادة؛ لا نطبع كامل الـ stack كخطأ
      if (error.response?.status !== 401) {
        console.error("Login error:", error);
      }
      const data = error.response?.data;
      const code = typeof data === 'object' && data != null ? data.code : null;
      if (error.response?.status === 403 && code === 'ACCOUNT_PENDING') {
        const e = new Error('ACCOUNT_PENDING');
        e.code = 'ACCOUNT_PENDING';
        throw e;
      }
      if (error.response?.status === 403 && code === 'ACCOUNT_DISABLED') {
        const e = new Error('ACCOUNT_DISABLED');
        e.code = 'ACCOUNT_DISABLED';
        throw e;
      }
      throw error;
    }
  };

  const register = async (data) => {
    const response = await axios.post('/auth/register', data);
    const body = response.data;
    if (body?.pendingApproval) {
      return body;
    }
    const { token, ...userData } = body;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return body;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth is co-located with AuthProvider (standard pattern for small apps).
// eslint-disable-next-line react-refresh/only-export-components -- hook export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};