import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Activity, ArrowUpRight, Database, ExternalLink, HardDrive, IndianRupee, Layers3, Shield, Trash2, Users, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";

interface ListingAdminRow {
  ai_verification_status: string | null;
  description: string;
  id: string;
  moderation_status: string;
  report_count: number;
  resource_link: string | null;
  seller_id: string;
  title: string;
  price: number;
  category: string;
  college: string;
  sold: boolean;
  created_at: string;
  images: string[] | null;
}

interface ProfileAdminRow {
  ban_reason: string | null;
  banned_at: string | null;
  id: string;
  is_banned: boolean;
  is_admin?: boolean;
  name: string;
  email: string;
  college: string;
  created_at: string;
  violation_count: number;
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
const PARTNER_ADMIN_EMAIL = "campuskartpartner@gmail.com";

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
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"requests" | "listings" | "members" | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingAdminRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileAdminRow[]>([]);
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequestRow[]>([]);
  const [collegeNameDrafts, setCollegeNameDrafts] = useState<Record<string, string>>({});
  const [pendingBanProfileId, setPendingBanProfileId] = useState<string | null>(null);
  const sectionContentRef = useRef<HTMLDivElement>(null);
  const isPartnerModerator = user?.email?.trim().toLowerCase() === PARTNER_ADMIN_EMAIL;

  useEffect(() => {
    if (isPartnerModerator) {
      setActiveSection("listings");
    }
  }, [isPartnerModerator]);

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
          .select("id, title, description, price, category, college, sold, created_at, images, seller_id, moderation_status, report_count, resource_link, ai_verification_status")
          .order("created_at", { ascending: false }),
        isPartnerModerator
          ? Promise.resolve({ data: [], error: null } as any)
          : supabase
              .from("profiles")
              .select("id, name, email, college, created_at, is_banned, violation_count, ban_reason, banned_at, is_admin")
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
      } else if (!isPartnerModerator) {
        setProfiles((profileData as ProfileAdminRow[]) || []);
      }

      if (collegeRequestError) {
        toast.error("Could not load college requests.");
      } else if (!isPartnerModerator) {
        const nextRequests = (collegeRequestData as CollegeRequestRow[]) || [];
        setCollegeRequests(nextRequests);
        setCollegeNameDrafts(
          Object.fromEntries(nextRequests.map((request) => [request.id, request.college_name]))
        );
      }

      setLoading(false);
    };

    fetchAdminData();
  }, [isAdmin, isAuthenticated, isPartnerModerator]);

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
  const pendingListings = listings.filter((listing) => listing.moderation_status === "pending_review");
  const overduePendingListings = pendingListings.filter(
    (listing) => Date.now() - new Date(listing.created_at).getTime() >= 10 * 60 * 60 * 1000
  );
  const freshPendingListings = pendingListings.filter(
    (listing) => Date.now() - new Date(listing.created_at).getTime() < 10 * 60 * 60 * 1000
  );
  const flaggedListings = listings.filter((listing) => listing.moderation_status === "flagged" || listing.moderation_status === "hidden");
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

  const handleRejectListing = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: "rejected",
      })
      .eq("id", listingId);

    if (error) {
      toast.error("Could not reject this listing.");
      return;
    }

    setListings((current) =>
      current.map((listing) =>
        listing.id === listingId
          ? { ...listing, moderation_status: "rejected" }
          : listing
      )
    );
    toast.success("Listing rejected.");
  };

  const handleApproveListing = async (listingId: string) => {
    const { error: listingError } = await supabase
      .from("listings")
      .update({
        moderation_status: "active",
        report_count: 0,
        hidden_at: null,
      })
      .eq("id", listingId);

    if (listingError) {
      toast.error("Could not approve this listing.");
      return;
    }

    await supabase.from("listing_reports").delete().eq("listing_id", listingId);

    setListings((current) =>
      current.map((listing) =>
        listing.id === listingId
          ? { ...listing, moderation_status: "active", report_count: 0 }
          : listing
      )
    );
    toast.success("Listing approved and reports cleared.");
  };

  const handleBanUser = async (profileId: string) => {
    const target = profiles.find((profile) => profile.id === profileId);
    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: "Repeated listing violations",
        violation_count: (target?.violation_count || 0) + 1,
      })
      .eq("id", profileId);

    if (error) {
      toast.error("Could not ban this user.");
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              is_banned: true,
              banned_at: new Date().toISOString(),
              ban_reason: "Repeated listing violations",
              violation_count: profile.violation_count + 1,
            }
          : profile
      )
    );
    toast.success("User banned for repeated violations.");
    setPendingBanProfileId(null);
  };

  const handleDeleteAccount = async (profileId: string) => {
    const target = profiles.find((profile) => profile.id === profileId);
    if (!target) return;

    if (target.is_admin) {
      toast.error("Admin accounts cannot be deleted from member snapshot.");
      return;
    }

    const confirmed = window.confirm(`Delete ${target.name || "this account"} permanently? This will remove the user and their listings.`);
    if (!confirmed) return;

    const rpcClient = supabase as any;
    const { error } = await rpcClient.rpc("admin_delete_account", { target_user_id: profileId });
    if (error) {
      toast.error("Could not delete this account permanently yet.");
      return;
    }

    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    setListings((current) => current.filter((listing) => listing.seller_id !== profileId));
    toast.success("Account deleted permanently.");
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

  const handleDeleteCollegeRequest = async (id: string) => {
    const target = collegeRequests.find((request) => request.id === id);
    if (!target) return;

    const confirmed = window.confirm(`Remove the college request for ${target.college_name}?`);
    if (!confirmed) return;

    const { error } = await supabase.from("college_requests").delete().eq("id", id);

    if (error) {
      toast.error("Could not remove this college request yet.");
      return;
    }

    setCollegeRequests((current) => current.filter((request) => request.id !== id));
    setCollegeNameDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    if (target.status === "approved") {
      invalidateInstitutionNamesCache();
    }

    toast.success("College request removed.");
  };

  const handleSectionChange = (section: "requests" | "listings" | "members") => {
    setActiveSection((current) => (current === section ? null : section));

    window.setTimeout(() => {
      sectionContentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
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
      {!isPartnerModerator && <div className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.80),rgba(255,255,255,0.92))]">
        <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                <Shield className="h-3.5 w-3.5" /> {isPartnerModerator ? "Listing review partner" : "Admin control room"}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {isPartnerModerator ? "Listing Moderation Desk" : "Platform Command Center"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {isPartnerModerator
                  ? "This partner account can only review listing submissions, reject bad posts, and ban repeat offenders."
                  : "Compact, high-signal control for listings, users, storage pressure, and direct Supabase operations."}
              </p>
            </div>
            {!isPartnerModerator && <div className="grid gap-2 sm:grid-cols-2">
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
            </div>}
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
      </div>}

      <AlertDialog open={!!pendingBanProfileId} onOpenChange={(open) => !open && setPendingBanProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to ban this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently block the account from using CampusKart until you manually unban it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingBanProfileId && void handleBanUser(pendingBanProfileId)}
            >
              Ban forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {!isPartnerModerator && <Alert className="mb-4 border-primary/20 bg-primary/5 py-3">
          <Wrench className="h-4 w-4" />
          <AlertTitle>Space monitoring note</AlertTitle>
          <AlertDescription>
            This dashboard estimates database footprint from frontend-readable data. Real quota and upgrades still happen in Supabase.
          </AlertDescription>
        </Alert>}

        {!isPartnerModerator && <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
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
        </div>}

        <div className="mt-4 space-y-4">
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{isPartnerModerator ? "Moderation" : "Admin sections"}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isPartnerModerator
                      ? "This partner account can only access listing moderation."
                      : "Open one section at a time so the panel stays compact as data grows."}
                  </p>
                </div>
                <div className={`grid gap-2 ${isPartnerModerator ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
                  {!isPartnerModerator && (
                  <Button
                    variant={activeSection === "requests" ? "default" : "outline"}
                    className="h-9 w-full justify-between text-xs sm:text-sm"
                    onClick={() => handleSectionChange("requests")}
                  >
                    <span>College Requests</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{collegeRequests.length}</Badge>
                  </Button>
                  )}
                  <Button
                    variant={activeSection === "listings" ? "default" : "outline"}
                    className="h-9 w-full justify-between text-xs sm:text-sm"
                    onClick={() => handleSectionChange("listings")}
                  >
                    <span>Listing Moderation</span>
                      <Badge variant="secondary" className="ml-2 text-[10px]">{pendingListings.length + flaggedListings.length}</Badge>
                  </Button>
                  {!isPartnerModerator && (
                  <Button
                    variant={activeSection === "members" ? "default" : "outline"}
                    className="h-9 w-full justify-between text-xs sm:text-sm"
                    onClick={() => handleSectionChange("members")}
                  >
                    <span>Member Snapshot</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{profiles.length}</Badge>
                  </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
          <div ref={sectionContentRef}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCollegeRequest(request.id)}
                        >
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

          {activeSection === "listings" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" /> Listing moderation
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Manual review queue, overdue items, and flagged listings.</p>
                </div>
                <Badge variant="secondary">{pendingListings.length + flaggedListings.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading admin data...</p>
              ) : pendingListings.length === 0 && flaggedListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings are waiting for review right now.</p>
              ) : (
                <div className="space-y-5">
                  {freshPendingListings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Review queue</p>
                      {freshPendingListings.map((listing) => (
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {listing.images?.[0] ? (
                              <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleRejectListing(listing.id)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {overduePendingListings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Not reviewed items</p>
                      {overduePendingListings.map((listing) => (
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {listing.images?.[0] ? (
                              <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                              <Badge variant="destructive" className="text-[10px]">10h+ pending</Badge>
                            </div>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleRejectListing(listing.id)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {flaggedListings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flagged listings</p>
                      {flaggedListings.map((listing) => (
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {listing.images?.[0] ? (
                              <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                              <Badge variant={listing.moderation_status === "hidden" ? "destructive" : "secondary"} className="text-[10px] capitalize">{listing.moderation_status}</Badge>
                            </div>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            {isPartnerModerator ? (
                              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleRejectListing(listing.id)}>
                                Reject
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteListing(listing.id)}>
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                          {profile.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
                            {profile.is_admin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                            {profile.is_banned && <Badge variant="destructive" className="text-[10px]">Banned</Badge>}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                          <p className="text-xs text-muted-foreground">{profile.college}</p>
                          {profile.violation_count > 0 && (
                            <p className="text-xs text-muted-foreground">{profile.violation_count} violation(s)</p>
                          )}
                        </div>
                        </div>
                        {!profile.is_admin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAccount(profile.id)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
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
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
