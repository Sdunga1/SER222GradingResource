'use client';

import React, { createContext, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userId?: string;
}

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ isAuthenticated: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
