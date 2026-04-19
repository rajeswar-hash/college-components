import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { canonicalInstitutionName } from "@/lib/institutions";
import { sanitizeEmailInput, sanitizeSingleLineInput } from "@/lib/inputSecurity";
import { uploadStudentVerificationImage } from "@/lib/storage";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  seller_verification_status?: "pending" | "approved" | "rejected";
  student_id_card_path?: string | null;
  student_id_reviewed_at?: string | null;
  student_id_rejection_reason?: string | null;
  is_admin?: boolean;
  is_banned?: boolean;
  ban_reason?: string | null;
  violation_count?: number;
  avatar_url?: string;
}

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string, name: string, phone: string, college: string, studentIdFile: File) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "phone" | "college" | "avatar_url">>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PARTNER_ADMIN_EMAIL = "campuskartpartner@gmail.com";

function hasValidWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10;
}

function isEmailConfirmed(user: SupabaseUser | null) {
  if (!user) return false;
  return !!(user.email_confirmed_at || user.confirmed_at);
}

function isProfileComplete(profile: Pick<Profile, "name" | "phone" | "college"> | null) {
  if (!profile) return false;
  return [profile.name, profile.phone, profile.college].every((value) => value.trim().length > 0);
}

function deriveSellerVerificationStatus(
  profile: Pick<Profile, "name" | "phone" | "college" | "student_id_card_path" | "seller_verification_status" | "is_admin"> | null
) {
  if (!profile) return "pending" as const;
  if (profile.is_admin) return "approved" as const;
  if (profile.seller_verification_status === "approved" || profile.seller_verification_status === "rejected") {
    return profile.seller_verification_status;
  }
  if (!profile.student_id_card_path && isProfileComplete(profile)) {
    return "approved" as const;
  }
  return "pending" as const;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      const sellerVerificationStatus = deriveSellerVerificationStatus({
        name: data.name,
        phone: data.phone,
        college: data.college,
        student_id_card_path: data.student_id_card_path ?? null,
        seller_verification_status: (data.seller_verification_status ?? null) as "pending" | "approved" | "rejected" | null,
        is_admin: data.is_admin ?? false,
      });
      const nextProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.college,
        is_admin: data.is_admin ?? false,
        is_banned: data.is_banned ?? false,
        ban_reason: data.ban_reason ?? null,
        violation_count: data.violation_count ?? 0,
        avatar_url: data.avatar_url ?? undefined,
        seller_verification_status: sellerVerificationStatus,
        student_id_card_path: data.student_id_card_path ?? null,
        student_id_reviewed_at: data.student_id_reviewed_at ?? null,
        student_id_rejection_reason: data.student_id_rejection_reason ?? null,
      };
      const isPartnerAdmin = nextProfile.email?.trim().toLowerCase() === PARTNER_ADMIN_EMAIL;
      setProfile(isProfileComplete(nextProfile) || nextProfile.is_admin || isPartnerAdmin ? nextProfile : null);
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
    setIsAdmin(!!profile?.is_admin || profile?.email?.trim().toLowerCase() === PARTNER_ADMIN_EMAIL);
    setIsBanned(!!profile?.is_banned);
  }, [profile?.email, profile?.is_admin, profile?.is_banned]);

  const profileComplete = isProfileComplete(profile);

  const register = useCallback(async (email: string, password: string, name: string, phone: string, college: string, studentIdFile: File) => {
    const normalizedEmail = sanitizeEmailInput(email);
    const normalizedName = sanitizeSingleLineInput(name);
    const normalizedPhone = sanitizeSingleLineInput(phone);
    const normalizedCollege = canonicalInstitutionName(sanitizeSingleLineInput(college));
    if (!studentIdFile) {
      throw new Error("Please upload your college ID card before continuing.");
    }
    if (!hasValidWhatsappNumber(normalizedPhone)) {
      throw new Error("Please enter a valid WhatsApp number so buyers can contact you.");
    }
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;

    const verifiedUser = currentUser ?? supabaseUser;
    if (!verifiedUser?.id || !verifiedUser.email || verifiedUser.email.trim().toLowerCase() !== normalizedEmail) {
      throw new Error("Verify the OTP sent to your email before finishing signup.");
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("name, phone, college")
      .eq("id", verifiedUser.id)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;

    const alreadyConfigured =
      !!existingProfile &&
      [existingProfile.name, existingProfile.phone, existingProfile.college].some((value) => value.trim().length > 0);
    if (alreadyConfigured) {
      throw new Error("An account with this email already exists. Sign in or use Forgot password instead.");
    }

    const studentIdCardPath = await uploadStudentVerificationImage(verifiedUser.id, studentIdFile);

    const { error: authUpdateError } = await supabase.auth.updateUser({
      password,
      data: {
        name: normalizedName,
        phone: normalizedPhone,
        college: normalizedCollege,
        email: normalizedEmail,
        seller_verification_status: "pending",
      },
    });
    if (authUpdateError) throw authUpdateError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: normalizedName,
        phone: normalizedPhone,
        college: normalizedCollege,
        email: normalizedEmail,
        seller_verification_status: "pending",
        student_id_card_path: studentIdCardPath,
        student_id_reviewed_at: null,
        student_id_rejection_reason: null,
      })
      .eq("id", verifiedUser.id);
    if (profileError) throw profileError;

    await fetchProfile(verifiedUser.id);
  }, [fetchProfile, supabaseUser]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = sanitizeEmailInput(email);
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { isAdmin: false };
    }

    if (!isEmailConfirmed(userData.user)) {
      await supabase.auth.signOut();
      throw new Error("Verify your email before signing in. Use the verification link sent to your inbox.");
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin, is_banned, ban_reason, name, phone, college")
      .eq("id", userData.user.id)
      .single();

    const profileComplete =
      !!profileData &&
      [profileData.name, profileData.phone, profileData.college].every((value) => (value ?? "").trim().length > 0);
    if (!profileComplete) {
      await supabase.auth.signOut();
      throw new Error("Finish creating your account first. Complete the profile step after OTP verification.");
    }

    if (profileData?.is_banned) {
      await supabase.auth.signOut();
      throw new Error(profileData.ban_reason || "This account is restricted. Please contact support.");
    }

    const isPartnerAdmin = normalizedEmail === PARTNER_ADMIN_EMAIL;
    return { isAdmin: !!profileData?.is_admin || isPartnerAdmin };
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
    const normalizedUpdates = {
      ...updates,
      ...(typeof updates.name === "string" ? { name: sanitizeSingleLineInput(updates.name) } : {}),
      ...(typeof updates.phone === "string" ? { phone: sanitizeSingleLineInput(updates.phone) } : {}),
      ...(typeof updates.college === "string" ? { college: sanitizeSingleLineInput(updates.college) } : {}),
    };
    if (typeof normalizedUpdates.phone === "string" && normalizedUpdates.phone.trim() && !hasValidWhatsappNumber(normalizedUpdates.phone)) {
      throw new Error("Please enter a valid WhatsApp number so buyers can contact you.");
    }

    const nextCollege = normalizedUpdates.college ? canonicalInstitutionName(normalizedUpdates.college) : undefined;
    const payload = {
      ...normalizedUpdates,
      ...(nextCollege ? { college: nextCollege } : {}),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", supabaseUser.id);
    if (error) throw error;

    setProfile((current) =>
      current
        ? {
            ...current,
            ...normalizedUpdates,
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
      isAuthenticated: isAdmin || (!!supabaseUser && profileComplete),
      isAdmin,
      isBanned,
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
