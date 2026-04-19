import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
  }, [isAdmin, isAuthenticated, loading, navigate]);

  const resetForgotFlow = () => {
    setOtp("");
    setForgotStep("email");
  };

  const sendOtp = async () => {
    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) throw error;

      setOtp("");
      setForgotStep("otp");
      toast.success("OTP sent to your email. Enter it to continue.");
      window.setTimeout(() => otpRef.current?.focus(), 50);
      return true;
    } catch (err: any) {
      const rawMessage = String(err?.message || "");
      const friendlyMessage = /signups not allowed for otp/i.test(rawMessage)
        ? "This email is not registered on CampusKart."
        : rawMessage || "Could not send OTP.";
      toast.error(friendlyMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const verifyForgotOtp = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP sent to your email.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;

      toast.success("OTP verified. Set your new password now.");
      navigate("/reset-password");
    } catch (err: any) {
      toast.error(err.message || "Could not verify OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === "forgot") {
      if (forgotStep === "email") {
        await sendOtp();
      } else {
        await verifyForgotOtp();
      }
      return;
    }

    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Please enter email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      toast.success(result.isAdmin ? "Admin access granted." : "Welcome back!");
      navigate(result.isAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
        <Navbar />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
      <Navbar />
      <div className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-md">
          <Card className="border-border/70 bg-background/90 shadow-[0_20px_60px_rgba(20,184,166,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-900/88 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
            <CardHeader className="space-y-3 text-center">
              {mode === "forgot" && (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-primary-foreground shadow-sm">
                  <KeyRound className="h-6 w-6" />
                </div>
              )}
              <CardTitle className="font-display text-3xl text-foreground">
                {mode === "login" ? "Welcome Back" : "Reset Password"}
              </CardTitle>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                {mode === "login"
                  ? "Sign in to publish listings, like products, and manage your dashboard."
                  : forgotStep === "email"
                    ? "Enter your account email and we will send an OTP to continue."
                    : "Enter the OTP from your email inbox to continue to password reset."}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (mode === "forgot" && forgotStep !== "email") {
                        resetForgotFlow();
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete={mode === "login" ? "email" : "username"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                {mode === "login" && (
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          resetForgotFlow();
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                )}

                {mode === "forgot" && forgotStep === "otp" && (
                  <div>
                    <Label htmlFor="forgot-otp">Email OTP</Label>
                    <Input
                      id="forgot-otp"
                      ref={otpRef}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Verify this OTP before resetting your password.</span>
                      <button
                        type="button"
                        onClick={() => void sendOtp()}
                        className="font-medium text-primary hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
                  {submitting ? "Please wait..." : mode === "login" ? "Sign In" : forgotStep === "email" ? "Send OTP" : "Verify OTP"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account? " : "Remembered your password? "}
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === "login") {
                        navigate("/register");
                        return;
                      }
                      setMode("login");
                      resetForgotFlow();
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    {mode === "login" ? "Register" : "Sign In"}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
