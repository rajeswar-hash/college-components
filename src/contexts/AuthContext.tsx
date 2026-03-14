import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User } from "@/lib/types";
import { getUser, saveUser, clearUser } from "@/lib/store";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser());

  const login = useCallback((u: User) => {
    saveUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
