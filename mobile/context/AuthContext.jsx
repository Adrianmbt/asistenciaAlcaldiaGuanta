import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Verificando sesión guardada

  // Al iniciar la app, intentar restaurar sesión guardada
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const userJson = await SecureStore.getItemAsync('user');
        if (token && userJson) {
          setToken(token);
          setUser(JSON.parse(userJson));
        }
      } catch (e) {
        // Si falla la lectura, simplemente no hay sesión
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    setToken(data.access_token);
    setUser(data.user);
    await SecureStore.setItemAsync('token', data.access_token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
