import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CollegeAutocomplete } from "@/components/CollegeAutocomplete";
import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [registerStep, setRegisterStep] = useState<"email" | "otp" | "profile">("email");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const collegeRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const moveOnEnter =
    (nextRef?: React.RefObject<HTMLInputElement>) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      nextRef?.current?.focus();
    };

  const resetForm = () => {
    setEmail("");
    setOtp("");
    setPassword("");
    setName("");
    setPhone("");
    setCollege("");
    setResetLinkSent(false);
    setRegisterStep("email");
    setForgotStep("email");
  };

  const normalizedEmail = email.trim().toLowerCase();

  const sendOtp = async (target: "register" | "forgot") => {
    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: target === "register",
        },
      });
      if (error) throw error;

      setOtp("");
      setResetLinkSent(false);
      if (target === "register") {
        setRegisterStep("otp");
        toast.success("OTP sent to your email. Enter the code to continue.");
      } else {
        setForgotStep("otp");
        toast.success("OTP sent to your email. Enter it to verify before reset.");
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || "Could not send OTP.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const verifyRegisterOtp = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP sent to your email.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;

      setRegisterStep("profile");
      toast.success("Email verified. Complete your profile to finish signup.");
    } catch (err: any) {
      toast.error(err.message || "Incorrect OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyForgotOtpAndSendReset = async () => {
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

      const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (resetError) throw resetError;

      setResetLinkSent(true);
      setForgotStep("done");
      await supabase.auth.signOut();
      toast.success("Email verified. A password reset link has been sent to your inbox.");
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
        await sendOtp("forgot");
      } else if (forgotStep === "otp") {
        await verifyForgotOtpAndSendReset();
      }
      return;
    }

    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    if (mode === "register") {
      if (registerStep === "email") {
        await sendOtp("register");
        return;
      }

      if (registerStep === "otp") {
        await verifyRegisterOtp();
        return;
      }

      if (!password || password.length < 6) {
        toast.error("Please enter a password with at least 6 characters.");
        return;
      }

      if (!name || !phone || !college) {
        toast.error("Please fill in all fields");
        return;
      }
    } else if (!password || password.length < 6) {
      toast.error("Please enter email and password (min 6 chars)");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        toast.success(result.isAdmin ? "Admin access granted." : "Welcome back!");
        if (result.isAdmin) {
          navigate("/admin");
        }
      } else {
        await register(email, password, name, phone, college);
        toast.success("Account created successfully. You can now sign in with your email and password.");
      }
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
          setMode("login");
          onClose();
        }
      }}
    >
      <DialogContent className="glass w-[calc(100%-1.5rem)] max-w-md max-h-[85vh] overflow-visible rounded-2xl p-0">
        <div className="max-h-[85vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <DialogHeader className="pr-8 text-center sm:text-center">
            <DialogTitle className="font-display text-2xl text-center">
              {mode === "login" ? "Welcome Back" : mode === "register" ? "Join CampusKart" : "Reset Password"}
            </DialogTitle>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground text-center">
              {mode === "login"
                ? "Sign in to publish listings, like products, and manage your dashboard."
                : mode === "register"
                  ? registerStep === "profile"
                    ? "Your email is verified. Finish your profile and set your password."
                    : "Enter your email, verify the OTP from your inbox, then complete your profile."
                  : forgotStep === "done"
                    ? "Your email was verified first. Use the reset link sent to your inbox to create a new password."
                    : "Enter your account email, verify the OTP from your inbox, then receive your reset link."}
            </p>
          </DialogHeader>

          {mode !== "forgot" && (
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                className={mode === "login" ? "gradient-bg text-primary-foreground border-0" : "text-muted-foreground"}
                onClick={() => {
                  resetForm();
                  setMode("login");
                }}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "ghost"}
                className={mode === "register" ? "gradient-bg text-primary-foreground border-0" : "text-muted-foreground"}
                onClick={() => {
                  resetForm();
                  setMode("register");
                }}
              >
                Register
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (resetLinkSent) setResetLinkSent(false);
                  if (mode === "register" && registerStep !== "email") {
                    setRegisterStep("email");
                    setOtp("");
                  }
                  if (mode === "forgot" && forgotStep !== "email") {
                    setForgotStep("email");
                    setOtp("");
                  }
                }}
                onKeyDown={moveOnEnter(mode === "login" ? passwordRef : otpRef)}
                placeholder="you@example.com"
                autoComplete={mode === "login" ? "email" : "username"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={
                  (mode === "register" && registerStep === "profile") ||
                  (mode === "forgot" && forgotStep === "done")
                }
              />
              {mode === "register" && registerStep === "email" && (
                <p className="mt-1 text-xs text-muted-foreground">We will send an OTP to this email before profile setup.</p>
              )}
            </div>

            {mode === "register" && registerStep === "otp" && (
              <div>
                <Label htmlFor="register-otp">Email OTP</Label>
                <Input
                  id="register-otp"
                  ref={otpRef}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Enter the OTP from your email inbox.</span>
                  <button
                    type="button"
                    onClick={() => void sendOtp("register")}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend OTP
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
                  <span className="text-muted-foreground">Verify this OTP before we send the reset link.</span>
                  <button
                    type="button"
                    onClick={() => void sendOtp("forgot")}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && registerStep === "profile" && (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={moveOnEnter(collegeRef)}
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                  />
                </div>
                <CollegeAutocomplete
                  value={college}
                  onChange={setCollege}
                  inputRef={collegeRef}
                  onNextField={() => phoneRef.current?.focus()}
                  dropdownPosition="above"
                />
                <div>
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input
                    id="phone"
                    ref={phoneRef}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={moveOnEnter(emailRef)}
                    placeholder="919876543210"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Enter a valid 10-digit WhatsApp number so buyers can reach you.</p>
                </div>
              </>
            )}

            {mode === "forgot" && resetLinkSent && (
              <Alert className="border-primary/20 bg-primary/5 text-left">
                <AlertDescription>
                  Your email was verified first. A fresh reset link was sent to this inbox. Use the newest email only.
                </AlertDescription>
              </Alert>
            )}

            {(mode === "login" || (mode === "register" && registerStep === "profile")) && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    ref={passwordRef}
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
                <div className="mt-1 flex items-center justify-between gap-3">
                  {mode === "register" ? (
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
                  ) : (
                    <span />
                  )}
                  {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode("forgot");
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "register"
                    ? registerStep === "email"
                      ? "Send OTP"
                      : registerStep === "otp"
                        ? "Verify OTP"
                        : "Create Account"
                    : forgotStep === "email"
                      ? "Send OTP"
                      : forgotStep === "otp"
                        ? "Verify OTP & Send Reset Link"
                        : "Reset Link Sent"}
            </Button>

            <p className="pb-1 text-center text-sm text-muted-foreground">
              {mode === "forgot" ? (
                <>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode("login");
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode(mode === "login" ? "register" : "login");
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "login" ? "Register" : "Sign In"}
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
