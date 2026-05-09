
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiServerClient.fetch('/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const response = await apiServerClient.fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al iniciar sesión');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, passwordConfirm) => {
    const response = await apiServerClient.fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, passwordConfirm })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const firstFieldError = errorData.details && typeof errorData.details === 'object'
        ? Object.values(errorData.details).find((v) => v?.message)?.message
        : null;
      throw new Error(
        firstFieldError || errorData.error || errorData.message || 'Error al registrarse'
      );
    }
    return await response.json();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Has cerrado sesión exitosamente');
  };

  const value = {
    user,
    currentUser: user,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin' || user?.role === 'admin',
    loading,
    login,
    register,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
