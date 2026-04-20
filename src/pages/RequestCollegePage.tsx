import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";

interface RequestCollegeLocationState {
  returnTo?: string;
  collegeName?: string;
}

export default function RequestCollegePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as RequestCollegeLocationState | null) ?? null;

  const [collegeName, setCollegeName] = useState(state?.collegeName || "");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const returnTo = useMemo(() => state?.returnTo || "/register", [state?.returnTo]);

  const goBack = () => {
    navigate(returnTo, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      college_name: collegeName.trim(),
      city: city.trim(),
      state: region.trim(),
      requester_name: "",
      requester_email: "",
    };

    if (!payload.college_name || !payload.city || !payload.state) {
      toast.error("Please fill all details before sending the college request.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("college_requests").insert(payload);
      if (error) throw error;

      navigate(returnTo, {
        replace: true,
        state: {
          requestedCollegeName: payload.college_name,
          collegeRequestSubmitted: true,
        },
      });
    } catch (error: any) {
      toast.error(error?.message || "Could not send college request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
      <Navbar />
      <div className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <Button variant="ghost" className="mb-4 gap-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Card className="border-border/70 bg-background/90 shadow-[0_20px_60px_rgba(20,184,166,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-900/88 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="font-display text-3xl text-foreground">Request to add college</CardTitle>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                Send the college details here. After submission, we’ll take you back to the page you were on.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="request-college-name">College name</Label>
                  <Input
                    id="request-college-name"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="Enter full college name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="request-city">City</Label>
                    <Input
                      id="request-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="request-state">State</Label>
                    <Input
                      id="request-state"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
                  {submitting ? "Sending..." : "Send College Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
