import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { canonicalInstitutionName } from "@/lib/institutions";

const ADMIN_EMAIL = "rajeswarbind39@gmail.com";
const ADMIN_PASSWORD = "raj84217#*";
const ADMIN_SESSION_KEY = "college-components-admin-session";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string, name: string, phone: string, college: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminProfile: Profile = {
  id: "admin-local",
  name: "Admin Control",
  email: ADMIN_EMAIL,
  phone: "Private",
  college: "College Components HQ",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.college,
        avatar_url: data.avatar_url ?? undefined,
      });
    }
  }, []);

  const activateAdmin = useCallback(() => {
    localStorage.setItem(ADMIN_SESSION_KEY, ADMIN_EMAIL);
    setIsAdmin(true);
    setSupabaseUser(null);
    setProfile(adminProfile);
  }, []);

  const clearAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
    setProfile((current) => (current?.id === adminProfile.id ? null : current));
  }, []);

  useEffect(() => {
    const storedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedAdmin === ADMIN_EMAIL) {
      activateAdmin();
      setLoading(false);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (localStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_EMAIL) {
          setLoading(false);
          return;
        }
        if (session?.user) {
          setSupabaseUser(session.user);
          // Defer profile fetch to avoid deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setSupabaseUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (localStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_EMAIL) {
        setLoading(false);
        return;
      }
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [activateAdmin, fetchProfile]);

  const register = useCallback(async (email: string, password: string, name: string, phone: string, college: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCollege = canonicalInstitutionName(college);
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name, phone, college: normalizedCollege, email: normalizedEmail },
      },
    });
    if (error) throw error;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      await supabase.auth.signOut();
      activateAdmin();
      return { isAdmin: true };
    }

    clearAdmin();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
    return { isAdmin: false };
  }, [activateAdmin, clearAdmin]);

  const logout = useCallback(async () => {
    clearAdmin();
    await supabase.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
  }, [clearAdmin]);

  const deleteAccount = useCallback(async () => {
    if (isAdmin) {
      throw new Error("The local admin account cannot be deleted from the user dashboard.");
    }

    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;

    await supabase.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{
      user: profile,
      supabaseUser,
      login,
      register,
      logout,
      deleteAccount,
      isAuthenticated: isAdmin || !!supabaseUser,
      isAdmin,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
