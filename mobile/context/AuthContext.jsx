import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, setToken, clearToken, setSessionClosedCallback, addWsListener, connectWebSocket } from '../api/client';

const AuthContext = createContext(null);

const parseTokenExp = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch { return null; }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const exp = parseTokenExp(token);
  return exp ? Date.now() >= exp : true;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const justLoggedInRef = useRef(false);
  const userRef = useRef(null);

  const logout = async () => {
    clearToken();
    setUser(null);
    userRef.current = null;
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  // Mantener userRef sincronizado con user
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Al iniciar la app, restaurar sesión si el token sigue vigente
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const userJson = await SecureStore.getItemAsync('user');
        if (token && userJson && !isTokenExpired(token)) {
          setToken(token);
          const parsed = JSON.parse(userJson);
          setUser(parsed);
          userRef.current = parsed;
        } else {
          await logout();
        }
      } catch (e) {
        // Sin sesión
      } finally {
        setLoading(false);
      }
    };
    restoreSession();

    setSessionClosedCallback(async () => {
      await logout();
      Alert.alert('Sesión cerrada', 'Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.');
    });

    const removeWsListener = addWsListener((data) => {
      if (data.type === 'session_closed' && data.username === userRef.current?.username) {
        if (justLoggedInRef.current) return;
        logout();
        Alert.alert('Sesión cerrada', 'Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.');
      }
    });

    connectWebSocket();

    return () => {
      setSessionClosedCallback(null);
      removeWsListener();
    };
  }, []);

  // Revisar expiración cada 10 segundos mientras haya sesión activa
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(async () => {
      const token = await SecureStore.getItemAsync('token');
      if (isTokenExpired(token)) await logout();
    }, 10000);
    return () => clearInterval(intervalRef.current);
  }, [user]);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    justLoggedInRef.current = true;
    setTimeout(() => { justLoggedInRef.current = false; }, 3000);
    setToken(data.access_token);
    setUser(data.user);
    userRef.current = data.user;
    await SecureStore.setItemAsync('token', data.access_token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    return data.user;
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
