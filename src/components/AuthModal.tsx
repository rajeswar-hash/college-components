import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password || password.length < 6) {
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
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
      setCollege("");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass w-[calc(100%-1.5rem)] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {mode === "login" ? "Account Access" : "New User Setup"}
          </p>
          <DialogTitle className="font-display text-2xl">
            {mode === "login" ? "Welcome Back" : "Join College Components"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to publish listings, like products, and manage your dashboard."
              : "Create your account to start selling, liking, and managing your listings."}
          </p>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1">
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" />
              </div>
              <CollegeAutocomplete value={college} onChange={setCollege} />
              <div>
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="919876543210" />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {mode === "register" && <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
            {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground pb-1">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
