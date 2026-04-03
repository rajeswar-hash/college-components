import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateInstitutionNamesCache } from "@/lib/institutions";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Activity, ArrowUpRight, Database, ExternalLink, HardDrive, IndianRupee, Layers3, Shield, Trash2, Users, Wallet, Wrench } from "lucide-react";
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
  created_at: string;
}

interface CollegeRequestRow {
  id: string;
  college_name: string;
  city: string;
  state: string;
  note: string;
  requester_name: string;
  requester_email: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const DATABASE_LIMIT_BYTES = 500 * 1024 * 1024;
const SUPABASE_BILLING_URL = "https://supabase.com/dashboard/org/ponqczgkbajoevlbqvny/billing";

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
  const [activeSection, setActiveSection] = useState<"requests" | "listings" | "members">("requests");
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingAdminRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileAdminRow[]>([]);
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequestRow[]>([]);
  const [collegeNameDrafts, setCollegeNameDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const fetchAdminData = async () => {
      setLoading(true);

      const [
        { data: listingData, error: listingError },
        { data: profileData, error: profileError },
        { data: collegeRequestData, error: collegeRequestError },
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, price, category, college, sold, created_at, images")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, name, email, college, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("college_requests")
          .select("id, college_name, city, state, note, requester_name, requester_email, status, created_at, reviewed_at")
          .order("created_at", { ascending: false }),
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

      if (collegeRequestError) {
        toast.error("Could not load college requests.");
      } else {
        const nextRequests = (collegeRequestData as CollegeRequestRow[]) || [];
        setCollegeRequests(nextRequests);
        setCollegeNameDrafts(
          Object.fromEntries(nextRequests.map((request) => [request.id, request.college_name]))
        );
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
  const averageListingValue = listings.length ? Math.round(totalListingValue / listings.length) : 0;
  const usageTone =
    usagePercent >= 85 ? "text-destructive" : usagePercent >= 60 ? "text-warning" : "text-success";
  const usageLabel =
    usagePercent >= 85 ? "Critical watch" : usagePercent >= 60 ? "Growing steadily" : "Healthy capacity";

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

  const handleCollegeRequestStatus = async (id: string, status: "approved" | "rejected") => {
    const editedCollegeName = (collegeNameDrafts[id] ?? "").trim();
    if (status === "approved" && !editedCollegeName) {
      toast.error("Please enter a college name before approving.");
      return;
    }

    const { error } = await supabase
      .from("college_requests")
      .update({
        college_name: status === "approved" ? editedCollegeName : collegeRequests.find((request) => request.id === id)?.college_name,
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Could not update this college request.");
      return;
    }

    setCollegeRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              college_name: status === "approved" ? editedCollegeName : request.college_name,
              status,
              reviewed_at: new Date().toISOString(),
            }
          : request
      )
    );
    invalidateInstitutionNamesCache();
    toast.success(status === "approved" ? "College request approved." : "College request rejected.");
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">This area is reserved for the admin account.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Back to home</Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.80),rgba(255,255,255,0.92))]">
        <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                <Shield className="h-3.5 w-3.5" /> Admin control room
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Platform Command Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Compact, high-signal control for listings, users, storage pressure, and direct Supabase operations.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="h-10 justify-between bg-background/80 text-xs sm:text-sm" onClick={() => openSupabasePage("editor")}>
                <span className="flex items-center">
                  <Database className="mr-2 h-4 w-4" /> Open database
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button className="gradient-bg h-10 justify-between border-0 text-xs text-primary-foreground hover:opacity-90 sm:text-sm" onClick={() => openExternalPage(SUPABASE_BILLING_URL)}>
                <span className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" /> Buy extra capacity
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Marketplace</Badge>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total listings</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">{listings.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Published marketplace items</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Accounts</Badge>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Registered users</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">{profiles.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Profiles inside the platform</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Inventory</Badge>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active vs sold</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">{activeListings}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{soldListings} sold items archived</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Value</Badge>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalog value</p>
                <p className="mt-1 font-display text-base font-bold text-foreground sm:text-xl">Rs. {totalListingValue.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Avg Rs. {averageListingValue.toLocaleString("en-IN")} per listing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Alert className="mb-4 border-primary/20 bg-primary/5 py-3">
          <Wrench className="h-4 w-4" />
          <AlertTitle>Space monitoring note</AlertTitle>
          <AlertDescription>
            This dashboard estimates database footprint from frontend-readable data. Real quota and upgrades still happen in Supabase.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" /> Database usage monitor
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Compact storage overview for current platform growth.</p>
                </div>
                <Badge variant="secondary" className={usageTone}>{usageLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Estimated used</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(databaseUsageBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Estimated remaining</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(remainingBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Assumed plan limit</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(DATABASE_LIMIT_BYTES)}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Quota pressure</span>
                  <span className={`font-semibold ${usageTone}`}>{usagePercent.toFixed(1)}%</span>
                </div>
                <Progress value={usagePercent} className="h-3" />
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground shadow-sm">
                {usagePercent >= 85
                  ? "Capacity is getting tight. Open billing and review add-ons before uploads start failing."
                  : usagePercent >= 60
                    ? "Usage is healthy but worth watching as more listings and images come in."
                    : "Current usage looks comfortable for continued growth."}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Admin actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm" variant="outline" onClick={() => openExternalPage(SUPABASE_BILLING_URL)}>
                Open billing page <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm" variant="outline" onClick={() => openExternalPage("https://supabase.com/docs/guides/platform/billing-on-supabase")}>
                Open billing guide <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm" variant="outline" onClick={() => openSupabasePage("storage/buckets")}>
                Open storage settings <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm" variant="outline" onClick={() => openSupabasePage("auth/users")}>
                Open auth users <ExternalLink className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live now</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{activeListings} active listings</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Accounts</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{profiles.length} registered users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 space-y-4">
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Admin sections</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Open one section at a time so the panel stays compact as data grows.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={activeSection === "requests" ? "default" : "outline"} className="h-9 text-xs sm:text-sm" onClick={() => setActiveSection("requests")}>
                    College Requests <Badge variant="secondary" className="ml-2 text-[10px]">{collegeRequests.length}</Badge>
                  </Button>
                  <Button variant={activeSection === "listings" ? "default" : "outline"} className="h-9 text-xs sm:text-sm" onClick={() => setActiveSection("listings")}>
                    Listing Moderation <Badge variant="secondary" className="ml-2 text-[10px]">{listings.length}</Badge>
                  </Button>
                  <Button variant={activeSection === "members" ? "default" : "outline"} className="h-9 text-xs sm:text-sm" onClick={() => setActiveSection("members")}>
                    Member Snapshot <Badge variant="secondary" className="ml-2 text-[10px]">{profiles.length}</Badge>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          {activeSection === "requests" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> College requests
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Review requested colleges and verify them before they appear in search.</p>
                </div>
                <Badge variant="secondary">{collegeRequests.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading college requests...</p>
              ) : collegeRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No college requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {collegeRequests.map((request) => (
                    <div key={request.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                            {request.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            College name
                          </p>
                          <Input
                            value={collegeNameDrafts[request.id] ?? request.college_name}
                            onChange={(e) =>
                              setCollegeNameDrafts((current) => ({
                                ...current,
                                [request.id]: e.target.value,
                              }))
                            }
                            className="h-9 text-sm"
                          />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {request.city}, {request.state}
                        </p>
                        {(request.requester_name || request.requester_email) && (
                          <p className="truncate text-xs text-muted-foreground">
                            Requested by {request.requester_name || "Unknown"} {request.requester_email ? `(${request.requester_email})` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {request.status !== "approved" && (
                          <Button size="sm" className="h-8 text-xs" onClick={() => handleCollegeRequestStatus(request.id, "approved")}>
                            Approve
                          </Button>
                        )}
                        {request.status !== "rejected" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCollegeRequestStatus(request.id, "rejected")}>
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {activeSection === "listings" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" /> Listing moderation
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Newest listings first, with compact moderation controls.</p>
                </div>
                <Badge variant="secondary">{listings.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading admin data...</p>
              ) : listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings found yet.</p>
              ) : (
                <div className="space-y-2">
                  {listings.map((listing) => (
                    <div key={listing.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
                          <Badge variant={listing.sold ? "secondary" : "outline"} className="text-[10px]">{listing.sold ? "Sold" : "Active"}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{listing.category}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {listing.category} • {listing.college} • Rs. {Number(listing.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!listing.sold && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleMarkSold(listing.id)}>
                            Mark sold
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteListing(listing.id)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {activeSection === "members" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Member snapshot
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Newest registered users first.</p>
                </div>
                <Badge variant="secondary">{profiles.length} members</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No user profiles available to show.</p>
              ) : (
                <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                          {profile.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                          <p className="text-xs text-muted-foreground">{profile.college}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
