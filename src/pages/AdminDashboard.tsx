import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, ExternalLink, HardDrive, Shield, Trash2, Users, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";

interface ListingAdminRow {
  id: string;
  title: string;
  price: number;
  category: string;
  college: string;
  sold: boolean;
  created_at: string;
  images: string[] | null;
}

interface ProfileAdminRow {
  id: string;
  name: string;
  email: string;
  college: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const DATABASE_LIMIT_BYTES = 500 * 1024 * 1024;

function byteSize(value: string) {
  return new TextEncoder().encode(value).length;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingAdminRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileAdminRow[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const fetchAdminData = async () => {
      setLoading(true);

      const [{ data: listingData, error: listingError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, price, category, college, sold, created_at, images")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, name, email, college")
          .order("name", { ascending: true }),
      ]);

      if (listingError) {
        toast.error("Could not load listing data for the admin dashboard.");
      } else {
        setListings((listingData as ListingAdminRow[]) || []);
      }

      if (profileError) {
        toast.error("Could not load profile data for the admin dashboard.");
      } else {
        setProfiles((profileData as ProfileAdminRow[]) || []);
      }

      setLoading(false);
    };

    fetchAdminData();
  }, [isAdmin, isAuthenticated]);

  const totalListingValue = useMemo(
    () => listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0),
    [listings]
  );

  const databaseUsageBytes = useMemo(() => {
    const listingBytes = listings.reduce((sum, listing) => {
      const imageBytes = (listing.images || []).reduce((imageSum, image) => imageSum + byteSize(image), 0);
      return (
        sum +
        byteSize(listing.id) +
        byteSize(listing.title || "") +
        byteSize(listing.category || "") +
        byteSize(listing.college || "") +
        byteSize(String(listing.price || 0)) +
        byteSize(String(listing.sold)) +
        imageBytes
      );
    }, 0);

    const profileBytes = profiles.reduce(
      (sum, profile) =>
        sum +
        byteSize(profile.id) +
        byteSize(profile.name || "") +
        byteSize(profile.email || "") +
        byteSize(profile.college || ""),
      0
    );

    return listingBytes + profileBytes;
  }, [listings, profiles]);

  const usagePercent = Math.min((databaseUsageBytes / DATABASE_LIMIT_BYTES) * 100, 100);
  const remainingBytes = Math.max(DATABASE_LIMIT_BYTES - databaseUsageBytes, 0);
  const activeListings = listings.filter((listing) => !listing.sold).length;
  const soldListings = listings.filter((listing) => listing.sold).length;
  const latestListings = listings.slice(0, 8);

  const openSupabasePage = (path: string) => {
    window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/${path}`, "_blank", "noopener,noreferrer");
  };

  const openExternalPage = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDeleteListing = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed. This project may still need stricter server-side admin permissions.");
      return;
    }

    setListings((current) => current.filter((listing) => listing.id !== id));
    toast.success("Listing removed.");
  };

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase.from("listings").update({ sold: true }).eq("id", id);
    if (error) {
      toast.error("Update failed. This project may still need stricter server-side admin permissions.");
      return;
    }

    setListings((current) => current.map((listing) => (listing.id === id ? { ...listing, sold: true } : listing)));
    toast.success("Listing marked as sold.");
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">This area is reserved for the admin account.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" /> Admin control room
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Platform Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Review marketplace activity, estimate database usage, and jump straight to Supabase billing when the project needs more capacity.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => openSupabasePage("editor")}>
              <Database className="mr-2 h-4 w-4" /> Open database
            </Button>
            <Button className="gradient-bg border-0 text-primary-foreground hover:opacity-90" onClick={() => openExternalPage("https://supabase.com/pricing")}>
              <Wallet className="mr-2 h-4 w-4" /> View upgrade options
            </Button>
          </div>
        </div>

        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Wrench className="h-4 w-4" />
          <AlertTitle>How space monitoring works here</AlertTitle>
          <AlertDescription>
            This dashboard shows an estimated database footprint from data the frontend can read. Real quota, billing, and add-on purchases still happen in Supabase.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-foreground">{listings.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Registered users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-foreground">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active vs sold</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-foreground">{activeListings}</p>
              <p className="text-sm text-muted-foreground">{soldListings} sold</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Catalog value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-foreground">Rs. {totalListingValue.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" /> Database usage monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated used</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatBytes(databaseUsageBytes)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated remaining</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatBytes(remainingBytes)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assumed plan limit</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatBytes(DATABASE_LIMIT_BYTES)}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quota pressure</span>
                  <span className="font-medium text-foreground">{usagePercent.toFixed(1)}%</span>
                </div>
                <Progress value={usagePercent} className="h-3" />
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                {usagePercent >= 85
                  ? "Capacity is getting tight. Open billing and review add-ons before uploads start failing."
                  : usagePercent >= 60
                    ? "Usage is healthy but worth watching as more listings and images come in."
                    : "Current usage looks comfortable for continued growth."}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>Admin actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-between" variant="outline" onClick={() => openExternalPage("https://supabase.com/pricing")}>
                Review pricing plans <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline" onClick={() => openExternalPage("https://supabase.com/docs/guides/platform/billing-on-supabase")}>
                Open billing guide <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline" onClick={() => openSupabasePage("storage/buckets")}>
                Open storage settings <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline" onClick={() => openSupabasePage("auth/users")}>
                Open auth users <ExternalLink className="h-4 w-4" />
              </Button>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">What this admin panel controls directly</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Marketplace summaries, listing moderation, and safe links into Supabase project tools. Billing lives at the organization level in Supabase, so this panel opens the pricing and billing guide instead of a broken project billing route.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Listing moderation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading admin data...</p>
              ) : latestListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings found yet.</p>
              ) : (
                <div className="space-y-3">
                  {latestListings.map((listing) => (
                    <div key={listing.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-foreground">{listing.title}</p>
                          <Badge variant={listing.sold ? "secondary" : "outline"}>{listing.sold ? "Sold" : "Active"}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {listing.category} • {listing.college} • Rs. {Number(listing.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!listing.sold && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>
                            Mark sold
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteListing(listing.id)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Member snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No user profiles available to show.</p>
              ) : (
                <div className="space-y-3">
                  {profiles.slice(0, 6).map((profile) => (
                    <div key={profile.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                      <p className="font-medium text-foreground">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground">{profile.college}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
