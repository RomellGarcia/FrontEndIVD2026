import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (username, tipo, userData) => {
    // El nuevo backend devuelve usuario con id y nombre en snake_case
    if (!userData || !userData.id || !userData.nombre) {
      console.error('Datos de usuario incompletos:', userData);
      return false;
    }

    const authData = {
      username,
      tipo,
      ...userData,
      // Guardar el token de Supabase para usarlo en requests
      token: userData.token || null
    };

    setUser(authData);
    sessionStorage.setItem('user', JSON.stringify(authData));

    // Guardar token también en sessionStorage por separado
    // para que el interceptor de api.js lo pueda leer fácilmente
    if (userData.token) {
      sessionStorage.setItem('token', userData.token);
    }

    return true;
  };

  const isAuthenticated = () => {
    return user && user.id && user.nombre;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = sessionStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);