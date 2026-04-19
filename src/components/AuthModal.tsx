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
import { Eye, EyeOff, ShieldCheck, Upload } from "lucide-react";
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
  const [registerStep, setRegisterStep] = useState<"form" | "otp">("form");
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    setStudentIdFile(null);
    setRegisterStep("form");
    setForgotStep("email");
  };

  const normalizedEmail = email.trim().toLowerCase();
  const openRegisterPage = () => {
    resetForm();
    onClose();
    navigate("/register");
  };

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
      if (target === "register") {
        setRegisterStep("otp");
        toast.success("OTP sent to your email. Enter the code to continue.");
      } else {
        setForgotStep("otp");
        toast.success("OTP sent to your email. Enter it to verify before reset.");
      }
      return true;
    } catch (err: any) {
      const rawMessage = String(err?.message || "");
      const friendlyMessage =
        target === "forgot" && /signups not allowed for otp/i.test(rawMessage)
          ? "This email is not registered on CampusKart."
          : rawMessage || "Could not send OTP.";
      toast.error(friendlyMessage);
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

      await register(email, password, name, phone, college, studentIdFile as File);
      toast.success("Account submitted for admin verification. You can sign in while approval is pending.");
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Incorrect OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyForgotOtpAndOpenReset = async () => {
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
      onClose();
      resetForm();
      window.location.href = `${window.location.origin}${window.location.pathname}#/reset-password`;
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
        await verifyForgotOtpAndOpenReset();
      }
      return;
    }

    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    if (mode === "register") {
      if (registerStep === "form") {
        if (!password || password.length < 6) {
          toast.error("Please enter a password with at least 6 characters.");
          return;
        }

        if (!name || !phone || !college) {
          toast.error("Please fill in all fields");
          return;
        }
        if (!studentIdFile) {
          toast.error("Please upload your college ID card.");
          return;
        }

        await sendOtp("register");
        return;
      }

      if (registerStep === "otp") {
        await verifyRegisterOtp();
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
          if ((mode === "register" && registerStep === "otp") || (mode === "forgot" && forgotStep === "otp")) {
            void supabase.auth.signOut();
          }
          resetForm();
          setMode("login");
          onClose();
        }
      }}
    >
      <DialogContent className={`glass w-[calc(100%-1.5rem)] ${mode === "register" ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-visible rounded-2xl p-0`}>
        <div className="max-h-[85vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <DialogHeader className="pr-8 text-center sm:text-center">
            <DialogTitle className="font-display text-2xl text-center">
              {mode === "login" ? "Welcome Back" : mode === "register" ? "Join CampusKart" : "Reset Password"}
            </DialogTitle>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground text-center">
              {mode === "login"
                ? "Sign in to publish listings, like products, and manage your dashboard."
                : mode === "register"
                  ? registerStep === "otp"
                    ? "Enter the OTP sent to your email. After that, your student ID goes to admin review before selling is enabled."
                    : "Create your account, verify your email, and upload your college ID card for admin approval."
                  : "Enter your account email and verify the OTP from your inbox before resetting your password."}
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
                variant="ghost"
                className="text-muted-foreground"
                onClick={openRegisterPage}
              >
                Register
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "register" && registerStep === "form" && (
              <Alert className="border-primary/20 bg-primary/5">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="text-xs leading-5">
                  Email OTP confirms the account belongs to you. Your college ID card is checked by admin to confirm you are a college student before selling is enabled.
                </AlertDescription>
              </Alert>
            )}

            {mode !== "register" || registerStep === "form" ? (
              <>
                {mode === "register" && (
                  <div className="grid gap-4 md:grid-cols-2">
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
                        placeholder="9876543210"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Enter a valid 10-digit WhatsApp number so buyers can reach you.</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="student-id">College ID Card</Label>
                      <label
                        htmlFor="student-id"
                        className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Upload className="h-4 w-4 text-primary" />
                            Upload student ID image
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Upload a clear photo of your current college ID card. JPG, PNG, or WEBP only.
                          </p>
                          {studentIdFile && (
                            <p className="mt-2 truncate text-xs font-medium text-primary">{studentIdFile.name}</p>
                          )}
                        </div>
                        <span className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
                          Choose file
                        </span>
                      </label>
                      <Input
                        id="student-id"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => setStudentIdFile(event.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (mode === "forgot" && forgotStep !== "email") {
                        setForgotStep("email");
                        setOtp("");
                      }
                    }}
                    onKeyDown={moveOnEnter(mode === "login" ? passwordRef : mode === "register" ? passwordRef : otpRef)}
                    placeholder="you@example.com"
                    autoComplete={mode === "login" ? "email" : "username"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  {mode === "register" && (
                    <p className="mt-1 text-xs text-muted-foreground">When you press Create Account, we will send an OTP to this email. After OTP verification, your account will wait for admin approval.</p>
                  )}
                </div>
              </>
            ) : null}

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
                  <span className="text-muted-foreground">Enter the OTP from your email inbox to finish account creation.</span>
                  <button
                    type="button"
                    onClick={() => void sendOtp("register")}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Once the OTP is verified, your college ID will be sent to CampusKart admin for approval. You will be able to sign in immediately, but selling stays locked until approval is complete.
                </p>
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

            {(mode === "login" || (mode === "register" && registerStep === "form")) && (
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
                    ? registerStep === "form"
                      ? "Create Account"
                    : registerStep === "otp"
                        ? "Verify OTP"
                        : "Create Account"
                    : forgotStep === "email"
                      ? "Send OTP"
                      : "Verify OTP"}
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
                      if (mode === "login") {
                        openRegisterPage();
                        return;
                      }
                      resetForm();
                      setMode("login");
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
