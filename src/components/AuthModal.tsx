import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, COLLEGES } from "@/lib/types";
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
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");

  const isValidEmail = (e: string) =>
    /\.edu$|\.ac\.in$|\.edu\.\w+$/i.test(e);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error("Please use a valid .edu or .ac.in email address");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (mode === "register" && (!name || !phone || !college)) {
      toast.error("Please fill in all fields");
      return;
    }

    const user: User = {
      id: "user-" + Date.now(),
      name: mode === "login" ? email.split("@")[0] : name,
      email,
      phone: mode === "login" ? "" : phone,
      college: mode === "login" ? "Unknown College" : college,
      joinedAt: new Date().toISOString(),
    };

    login(user);
    toast.success(mode === "login" ? "Welcome back!" : "Account created!");
    onClose();
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setCollege("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "login" ? "Welcome Back" : "Join Campus Components"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" />
          </div>
          {mode === "register" && (
            <>
              <CollegeAutocomplete value={college} onChange={setCollege} />
              <div>
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="919876543210" />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">College Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            <p className="text-xs text-muted-foreground mt-1">Must be a .edu or .ac.in email</p>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {mode === "register" && <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>}
          </div>

          <Button type="submit" className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
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
