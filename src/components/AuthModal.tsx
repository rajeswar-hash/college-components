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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    setPassword("");
    setName("");
    setPhone("");
    setCollege("");
    setResetLinkSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
        if (error) throw error;

        setResetLinkSent(true);
        toast.success("Password reset email sent. Open the newest email link to create a new password.");
      } catch (err: any) {
        toast.error(err.message || "Could not send reset email.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Please enter email and password (min 6 chars)");
      return;
    }

    if (mode === "register" && (!name || !phone || !college)) {
      toast.error("Please fill in all fields");
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
        toast.success("Account created! You may need to verify your email.");
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
                  ? "Create your account to start selling, liking, and managing your listings."
                  : "Enter your account email and we will send you a secure password reset link."}
            </p>
          </DialogHeader>

          {mode !== "forgot" && (
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                className={mode === "login" ? "gradient-bg text-primary-foreground border-0" : "text-muted-foreground"}
                onClick={() => setMode("login")}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "ghost"}
                className={mode === "register" ? "gradient-bg text-primary-foreground border-0" : "text-muted-foreground"}
                onClick={() => setMode("register")}
              >
                Register
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "register" && (
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
                }}
                onKeyDown={mode === "forgot" ? undefined : moveOnEnter(passwordRef)}
                placeholder="you@example.com"
                autoComplete={mode === "login" ? "email" : "username"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            {mode === "forgot" && resetLinkSent && (
              <Alert className="border-primary/20 bg-primary/5 text-left">
                <AlertDescription>
                  A fresh reset link was sent to this email. If needed, you can request another one and use the newest email only.
                </AlertDescription>
              </Alert>
            )}

            {mode !== "forgot" && (
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
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
              {submitting ? "Please wait..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : resetLinkSent ? "Resend Reset Link" : "Send Reset Link"}
            </Button>

            <p className="pb-1 text-center text-sm text-muted-foreground">
              {mode === "forgot" ? (
                <>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
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
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
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
