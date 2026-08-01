import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../api/index.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (username, tipo, userData) => {
    if (!userData || !userData.id || !userData.nombre) {
      console.error('Datos de usuario incompletos:', userData);
      return false;
    }

    const authData = {
      username,
      tipo,
      ...userData,
      token: userData.token || null
    };

    setUser(authData);
    sessionStorage.setItem('user', JSON.stringify(authData));
    if (userData.token) {
      sessionStorage.setItem('token', userData.token);
    }

    return true;
  };

  const isAuthenticated = () => {
    return user && user.id && user.nombre;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('No se pudo cerrar la sesión en el servidor:', err);
    }
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Al cargar la app, confirma con el backend que la sesión guardada sigue vigente.
  // Solo cierra sesión si el servidor rechaza el token (401/403); ante fallas de
  // red u otros errores, conserva la sesión local para no desloguear por mala conexión.
  useEffect(() => {
    const validarSesion = async () => {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) return;

      try {
        await authAPI.me();
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          logout();
        }
      }
    };
    validarSesion();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);