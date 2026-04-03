import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { canonicalInstitutionName } from "@/lib/institutions";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  is_admin?: boolean;
  avatar_url?: string;
}

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string, name: string, phone: string, college: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "phone" | "college" | "avatar_url">>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        is_admin: data.is_admin ?? false,
        avatar_url: data.avatar_url ?? undefined,
      });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setSupabaseUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    setIsAdmin(!!profile?.is_admin);
  }, [profile?.is_admin]);

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
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { isAdmin: false };
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    return { isAdmin: !!profileData?.is_admin };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
    setIsAdmin(false);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    if (isAdmin) {
      throw new Error("Admin accounts cannot be deleted from the user dashboard.");
    }

    const email = supabaseUser?.email || profile?.email;
    if (!email) {
      throw new Error("Could not verify this account. Please sign in again.");
    }

    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      throw new Error("Please enter your password to delete the account.");
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: normalizedPassword,
    });
    if (verifyError) throw new Error("Incorrect password. Please try again.");

    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;

    await supabase.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
  }, [isAdmin, profile?.email, supabaseUser?.email]);

  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, "name" | "phone" | "college" | "avatar_url">>) => {
    if (!supabaseUser?.id) {
      throw new Error("Please sign in again to update your profile.");
    }

    const nextCollege = updates.college ? canonicalInstitutionName(updates.college) : undefined;
    const payload = {
      ...updates,
      ...(nextCollege ? { college: nextCollege } : {}),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", supabaseUser.id);
    if (error) throw error;

    setProfile((current) =>
      current
        ? {
            ...current,
            ...updates,
            ...(nextCollege ? { college: nextCollege } : {}),
          }
        : current
    );
  }, [supabaseUser?.id]);

  return (
    <AuthContext.Provider value={{
      user: profile,
      supabaseUser,
      login,
      register,
      logout,
      deleteAccount,
      updateProfile,
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
