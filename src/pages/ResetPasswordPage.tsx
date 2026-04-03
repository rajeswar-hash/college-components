import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const hasRecoveryHash = useMemo(
    () =>
      typeof window !== "undefined" &&
      (window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token=")),
    []
  );

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        setSessionReady(true);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || !!session) {
        setSessionReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const goHome = () => {
    window.location.href = `${window.location.origin}${window.location.pathname}#/`;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated successfully.");
      window.location.href = `${window.location.origin}${window.location.pathname}#/`;
    } catch (err: any) {
      toast.error(err.message || "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,1))] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Card className="glass border-border/70 shadow-[0_20px_60px_rgba(20,184,166,0.10)]">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-primary-foreground shadow-sm">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-2xl text-foreground">Reset Your Password</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose a new password for your CampusKart account so you can sign in again safely.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasRecoveryHash || !sessionReady ? (
              <Alert className="border-primary/20 bg-primary/5">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Reset link required</AlertTitle>
                <AlertDescription>
                  Open this page from the password reset email you received. Once the secure recovery link is active, you can set a new password here.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90"
                >
                  {submitting ? "Updating Password..." : "Save New Password"}
                </Button>
              </form>
            )}

            <Button variant="outline" className="w-full" onClick={goHome}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
