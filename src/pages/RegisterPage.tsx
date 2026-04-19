import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { CollegeAutocomplete } from "@/components/CollegeAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [registerStep, setRegisterStep] = useState<"form" | "otp">("form");
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

  const normalizedEmail = email.trim().toLowerCase();

  const moveOnEnter =
    (nextRef?: React.RefObject<HTMLInputElement>) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      nextRef?.current?.focus();
    };

  const openLoginPopup = () => {
    sessionStorage.setItem("campuskart-open-auth", "login");
    navigate("/");
  };

  const sendOtp = async () => {
    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      setOtp("");
      setRegisterStep("otp");
      toast.success("OTP sent to your email. Enter the code to continue.");
      window.setTimeout(() => otpRef.current?.focus(), 50);
    } catch (err: any) {
      toast.error(err.message || "Could not send OTP.");
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
      openLoginPopup();
    } catch (err: any) {
      toast.error(err.message || "Incorrect OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (registerStep === "form") {
      if (!password || password.length < 6) {
        toast.error("Please enter a password with at least 6 characters.");
        return;
      }
      if (!name || !phone || !college) {
        toast.error("Please fill in all fields.");
        return;
      }
      if (!studentIdFile) {
        toast.error("Please upload your college ID card.");
        return;
      }

      await sendOtp();
      return;
    }

    await verifyRegisterOtp();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
      <Navbar />
      <div className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border/70 bg-background/90 shadow-[0_20px_60px_rgba(20,184,166,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-900/88 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="font-display text-3xl text-foreground">Join CampusKart</CardTitle>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                {registerStep === "otp"
                  ? "Enter the OTP sent to your email. After that, your student ID goes to admin review before selling is enabled."
                  : "Create your account, verify your email, and upload your college ID card for admin approval."}
              </p>
            </CardHeader>
            <CardContent>
              {registerStep === "form" && (
                <Alert className="mb-5 border-primary/20 bg-primary/5">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="text-xs leading-5">
                    Email OTP confirms the account belongs to you. Your college ID card is checked by admin to confirm you are a college student before selling is enabled.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {registerStep === "form" ? (
                  <>
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

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          ref={emailRef}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={moveOnEnter(passwordRef)}
                          placeholder="you@example.com"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">When you press Create Account, we will send an OTP to this email. After OTP verification, your account will wait for admin approval.</p>
                      </div>

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
                        <p className="mt-1 text-xs text-muted-foreground">At least 6 characters</p>
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
                  </>
                ) : (
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
                        onClick={() => void sendOtp()}
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

                <Button type="submit" disabled={submitting} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
                  {submitting ? "Please wait..." : registerStep === "form" ? "Create Account" : "Verify OTP"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={openLoginPopup} className="font-medium text-primary hover:underline">
                    Sign In
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
