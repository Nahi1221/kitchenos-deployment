import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/tenant/login/', { email, password });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success(`Welcome back, ${user.name || user.business_name || 'User'}!`);
      return { success: true, user };
      
      } catch (error) {
      delete api.defaults.headers.common['Authorization'];
      let message = 'Login failed. Please try again.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.error) {
          message = data.error;
        } else if (data.non_field_errors && data.non_field_errors.length > 0) {
          message = data.non_field_errors[0];
        } else if (data.detail) {
          message = data.detail;
        }
      }
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/admin/login/', { email, password });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success(`Welcome back, ${user.name || user.business_name || 'Admin'}!`);
      return { success: true, user };
      
    } catch (error) {
      delete api.defaults.headers.common['Authorization'];
      let message = 'Login failed. Please try again.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.error) {
          message = data.error;
        } else if (data.non_field_errors && data.non_field_errors.length > 0) {
          message = data.non_field_errors[0];
        } else if (data.detail) {
          message = data.detail;
        }
      }
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setLoading(true);
      
      const response = await api.post('/tenants/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      toast.success(response.data.message || 'Registration submitted! Awaiting admin approval.');
      return { success: true, data: response.data };
      
    } catch (error) {
      delete api.defaults.headers.common['Authorization'];
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token') && !!user;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const value = {
    user,
    loading,
    login,
    adminLogin,
    register,
    logout,
    isAuthenticated,
    getAuthHeaders,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}