// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Our configured Axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state

  // This effect runs on app startup to check if a user is already logged in
  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        // We don't have a "showMe" route, so we'll infer login state.
        // A better approach would be a /auth/showMe route in the backend.
        // For now, we'll rely on a manual check or persisted state if needed,
        // but for simplicity, we start fresh. The user logs in each time.
        setIsLoading(false); // Assume not logged in initially
      } catch (error) {
        setUser(null);
        setIsLoading(false);
      }
    };
    checkLoggedInUser();
  }, []);

  const login = async (role, credentials) => {
    const response = await api.post(`/auth/${role}/login`, credentials);
    setUser(response.data.user);
  };

  const register = async (role, details) => {
    const response = await api.post(`/auth/${role}/register`, details);
    setUser(response.data.user);
  };

  const logout = async () => {
    await api.get('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);