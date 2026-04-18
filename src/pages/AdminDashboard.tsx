import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canonicalInstitutionName, invalidateInstitutionNamesCache, loadInstitutionNames } from "@/lib/institutions";
import { sanitizeSingleLineInput } from "@/lib/inputSecurity";
import { categoryUsesCondition, normalizeCondition } from "@/lib/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Database, ExternalLink, HardDrive, IndianRupee, Layers3, MapPin, Shield, Tag, Trash2, Users, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";
import { getListingCoverImage, getListingPreviewImages, getListingPreviewPlaceholders } from "@/lib/listingImage";
import { deleteListingImages } from "@/lib/storage";
import { trackHandledError } from "@/lib/errorTracking";
import { LqipImage } from "@/components/LqipImage";

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
  condition: string;
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

interface SystemHealthRow {
  listing_count: number;
  pending_review_count: number;
  database_usage_bytes: number;
  listing_storage_bytes: number;
  listing_storage_growth_7d_bytes: number;
  storage_object_count: number;
  frontend_errors_24h: number;
}

interface FrontendErrorRow {
  id: string;
  created_at: string;
  route: string | null;
  source: string;
  severity: string;
  message: string;
  user_email: string | null;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const DATABASE_LIMIT_BYTES = 500 * 1024 * 1024;
const SUPABASE_BILLING_URL = "https://supabase.com/dashboard/org/ponqczgkbajoevlbqvny/billing";
const PARTNER_ADMIN_EMAIL = "campuskartpartner@gmail.com";
const MAIN_ADMIN_EMAIL = "rajeswarbind39@gmail.com";
const MAIN_ADMIN_PIN_UNLOCK_KEY = "campuskart-main-admin-pin-unlocked";

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
  const [activeSection, setActiveSection] = useState<"requests" | "listings" | "members" | "colleges" | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingAdminRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileAdminRow[]>([]);
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequestRow[]>([]);
  const [collegeNameDrafts, setCollegeNameDrafts] = useState<Record<string, string>>({});
  const [pendingBanProfileId, setPendingBanProfileId] = useState<string | null>(null);
  const [pendingRejectListingId, setPendingRejectListingId] = useState<string | null>(null);
  const [pendingRemoveCollegeName, setPendingRemoveCollegeName] = useState<string | null>(null);
  const [previewListing, setPreviewListing] = useState<ListingAdminRow | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [showCollegesWithListings, setShowCollegesWithListings] = useState(false);
  const [collegeList, setCollegeList] = useState<string[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [collegeListSearch, setCollegeListSearch] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [collegeOverrideError, setCollegeOverrideError] = useState("");
  const [cleaningDatabase, setCleaningDatabase] = useState(false);
  const [clearingErrors, setClearingErrors] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthRow | null>(null);
  const [recentErrors, setRecentErrors] = useState<FrontendErrorRow[]>([]);
  const [healthError, setHealthError] = useState("");
  const sectionContentRef = useRef<HTMLDivElement>(null);
  const isPartnerModerator = user?.email?.trim().toLowerCase() === PARTNER_ADMIN_EMAIL;
  const isMainAdmin = user?.email?.trim().toLowerCase() === MAIN_ADMIN_EMAIL;
  const previewImages = previewListing ? getListingPreviewImages(previewListing.category, previewListing.images) : [];
  const previewPlaceholders = previewListing ? getListingPreviewPlaceholders(previewListing.category, previewListing.images) : [];

  useEffect(() => {
    if (!isMainAdmin) return;
    if (localStorage.getItem(MAIN_ADMIN_PIN_UNLOCK_KEY) === "true") return;
    navigate("/dashboard", { replace: true });
    toast.error("Unlock the admin panel from your dashboard first.");
  }, [isMainAdmin, navigate]);

  useEffect(() => {
    if (isPartnerModerator) {
      setActiveSection("listings");
    }
  }, [isPartnerModerator]);

  useEffect(() => {
    setPreviewImageIndex(0);
  }, [previewListing]);

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
          .select("id, title, description, price, category, condition, college, sold, created_at, images, seller_id, moderation_status, report_count, resource_link, ai_verification_status")
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
        trackHandledError("admin.load-listings", listingError);
        toast.error("Could not load listing data for the admin dashboard.");
      } else {
        setListings((listingData as ListingAdminRow[]) || []);
      }

      if (profileError) {
        trackHandledError("admin.load-profiles", profileError);
        toast.error("Could not load profile data for the admin dashboard.");
      } else if (!isPartnerModerator) {
        setProfiles((profileData as ProfileAdminRow[]) || []);
      }

      if (collegeRequestError) {
        trackHandledError("admin.load-college-requests", collegeRequestError);
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

  const refreshSystemHealth = async () => {
    if (isPartnerModerator) return;

    setHealthLoading(true);
    setHealthError("");

    try {
      const [{ data: healthData, error: healthRpcError }, { data: recentErrorData, error: recentErrorQueryError }] =
        await Promise.all([
          (supabase as any).rpc("get_admin_system_health"),
          (supabase as any)
            .from("frontend_error_logs")
            .select("id, created_at, route, source, severity, message, user_email")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (healthRpcError) throw healthRpcError;
      if (recentErrorQueryError) throw recentErrorQueryError;

      setSystemHealth((healthData?.[0] as SystemHealthRow | undefined) || null);
      setRecentErrors((recentErrorData as FrontendErrorRow[]) || []);
    } catch (error) {
      trackHandledError("admin.load-system-health", error);
      setHealthError("Live system health is not ready yet, so fallback estimates are shown below.");
    } finally {
      setHealthLoading(false);
    }
  };

  const handleClearLatestErrors = async () => {
    if (recentErrors.length === 0 || clearingErrors) return;

    setClearingErrors(true);
    try {
      const errorIds = recentErrors.map((entry) => entry.id);
      const { error } = await supabase
        .from("frontend_error_logs")
        .delete()
        .in("id", errorIds);

      if (error) throw error;

      setRecentErrors([]);
      void refreshSystemHealth();
      toast.success("Latest error events cleared.");
    } catch (error) {
      trackHandledError("admin.clear-latest-errors", error, { count: recentErrors.length });
      toast.error("Could not clear the latest error events.");
    } finally {
      setClearingErrors(false);
    }
  };

  useEffect(() => {
    void refreshSystemHealth();
  }, [isPartnerModerator]);

  const totalListingValue = useMemo(
    () => listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0),
    [listings]
  );

  const estimatedDatabaseUsageBytes = useMemo(() => {
    const stringifySafe = (value: unknown) => {
      try {
        return JSON.stringify(value) || "";
      } catch {
        return "";
      }
    };

    const listingsBytes = byteSize(stringifySafe(listings));
    const profilesBytes = byteSize(stringifySafe(profiles));
    const requestsBytes = byteSize(stringifySafe(collegeRequests));

    return listingsBytes + profilesBytes + requestsBytes;
  }, [collegeRequests, listings, profiles]);
  const databaseUsageBytes = systemHealth?.database_usage_bytes ?? estimatedDatabaseUsageBytes;
  const storageUsageBytes = systemHealth?.listing_storage_bytes ?? 0;
  const storageGrowthBytes = systemHealth?.listing_storage_growth_7d_bytes ?? 0;
  const storageObjectCount = systemHealth?.storage_object_count ?? 0;
  const frontendErrors24h = systemHealth?.frontend_errors_24h ?? recentErrors.length;
  const usagePercent = Math.min((databaseUsageBytes / DATABASE_LIMIT_BYTES) * 100, 100);
  const remainingBytes = Math.max(DATABASE_LIMIT_BYTES - databaseUsageBytes, 0);
  const activeListings = listings.filter((listing) => !listing.sold).length;
  const pendingListings = listings.filter((listing) => listing.moderation_status === "pending_review");
  const pendingReviewCount = systemHealth?.pending_review_count ?? pendingListings.length;
  const overduePendingListings = pendingListings.filter(
    (listing) => Date.now() - new Date(listing.created_at).getTime() >= 10 * 60 * 60 * 1000
  );
  const freshPendingListings = pendingListings.filter(
    (listing) => Date.now() - new Date(listing.created_at).getTime() < 10 * 60 * 60 * 1000
  );
  const flaggedListings = listings.filter((listing) => listing.moderation_status === "flagged" || listing.moderation_status === "hidden");
  const visibleCollegeList = useMemo(() => {
    const query = collegeListSearch.trim().toLowerCase();
    if (!query) return collegeList;
    return collegeList.filter((college) => college.toLowerCase().includes(query));
  }, [collegeList, collegeListSearch]);
  const soldListings = listings.filter((listing) => listing.sold).length;
  const averageListingValue = listings.length ? Math.round(totalListingValue / listings.length) : 0;
  const collegesWithListings = useMemo(() => {
    const grouped = listings.reduce<Record<string, number>>((accumulator, listing) => {
      const collegeName = listing.college?.trim();
      if (!collegeName) return accumulator;
      accumulator[collegeName] = (accumulator[collegeName] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(grouped)
      .map(([college, count]) => ({ college, count }))
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.college.localeCompare(right.college);
      });
  }, [listings]);
  const usageTone =
    usagePercent >= 85 ? "text-destructive" : usagePercent >= 60 ? "text-warning" : "text-success";
  const usageLabel =
    usagePercent >= 85 ? "Critical watch" : usagePercent >= 60 ? "Growing steadily" : "Healthy capacity";

  const getListingSaleMeta = (sold: boolean) =>
    sold
      ? { label: "Sold", className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-200" }
      : { label: "Active", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-200" };

  const openSupabasePage = (path: string) => {
    window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/${path}`, "_blank", "noopener,noreferrer");
  };

  const openExternalPage = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDatabaseCleanup = async () => {
    const confirmed = window.confirm(
      "Clean safe database junk now? This only removes old rejected college requests, duplicate reports, and empty college override rows."
    );
    if (!confirmed) return;

    setCleaningDatabase(true);
    try {
      const { data, error } = await (supabase as any).rpc("admin_cleanup_database");
      if (error) throw error;

      const result = data?.[0];
      toast.success(
        `Database cleaned: ${result?.old_rejected_college_requests_removed ?? 0} old requests, ${result?.duplicate_reports_removed ?? 0} duplicate reports removed.`
      );
      void refreshSystemHealth();
    } catch {
      toast.error("Database cleanup is not available yet. Run the latest maintenance SQL first.");
    } finally {
      setCleaningDatabase(false);
    }
  };

  const refreshCollegeList = async () => {
    setLoadingColleges(true);
    setCollegeOverrideError("");
    try {
      invalidateInstitutionNamesCache();
      const names = await loadInstitutionNames();
      setCollegeList(names);
    } catch {
      toast.error("Could not load college list.");
    } finally {
      setLoadingColleges(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    const target = listings.find((listing) => listing.id === id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      trackHandledError("admin.delete-listing", error, { listingId: id });
      toast.error("Delete failed. This project may still need stricter server-side admin permissions.");
      return;
    }

    void deleteListingImages(target?.images);
    setListings((current) => current.filter((listing) => listing.id !== id));
    void refreshSystemHealth();
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
      trackHandledError("admin.reject-listing", error, { listingId });
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
    setPreviewListing((current) => (current?.id === listingId ? null : current));
    setPendingRejectListingId(null);
    void refreshSystemHealth();
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
      trackHandledError("admin.approve-listing", listingError, { listingId });
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
    setPreviewListing((current) => (current?.id === listingId ? null : current));
    void refreshSystemHealth();
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
      trackHandledError("admin.ban-user", error, { profileId });
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
    setPreviewListing((current) => (current?.seller_id === profileId ? null : current));
    void refreshSystemHealth();
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
      trackHandledError("admin.delete-account", error, { profileId });
      toast.error("Could not delete this account permanently yet.");
      return;
    }

    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    setListings((current) => current.filter((listing) => listing.seller_id !== profileId));
    void refreshSystemHealth();
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
      trackHandledError("admin.update-college-request", error, { requestId: id, status });
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
      trackHandledError("admin.delete-college-request", error, { requestId: id });
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

  const upsertCollegeOverride = async (collegeName: string, action: "add" | "remove") => {
    const safeCollegeName = canonicalInstitutionName(sanitizeSingleLineInput(collegeName));
    if (!safeCollegeName) {
      toast.error("Please enter a valid college name.");
      return false;
    }

    const { error } = await (supabase as any)
      .from("college_overrides")
      .upsert(
        {
          college_name: safeCollegeName,
          action,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "college_name" }
      );

    if (error) {
      setCollegeOverrideError("College manager needs the latest database migration before add/remove can be saved.");
      toast.error("Could not save this college change.");
      return false;
    }

    await refreshCollegeList();
    window.dispatchEvent(new Event("campuskart-colleges-updated"));
    return true;
  };

  const handleAddCollege = async () => {
    const added = await upsertCollegeOverride(newCollegeName, "add");
    if (!added) return;
    setNewCollegeName("");
    toast.success("College added to search.");
  };

  const handleRemoveCollege = async (collegeName: string) => {
    const removed = await upsertCollegeOverride(collegeName, "remove");
    if (removed) {
      setPendingRemoveCollegeName(null);
      toast.success("College removed from search.");
    }
  };

  const handleSectionChange = (section: "requests" | "listings" | "members" | "colleges") => {
    setActiveSection((current) => (current === section ? null : section));
    if (section === "colleges" && activeSection !== "colleges") {
      void refreshCollegeList();
    }

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
      {!isPartnerModerator && <div className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.80),rgba(255,255,255,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]">
        <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary shadow-sm dark:bg-slate-900/80">
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
              <Button variant="outline" className="h-10 justify-between bg-background/80 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80" onClick={() => openSupabasePage("editor")}>
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
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Inventory</Badge>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active vs sold</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Active</p>
                    <p className="mt-1 font-display text-lg font-bold text-foreground">{activeListings}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">Sold</p>
                    <p className="mt-1 font-display text-lg font-bold text-foreground">{soldListings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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

          {isMainAdmin && (
            <Card className="mt-4 overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Colleges with listings
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      All colleges that currently have items in the marketplace database.
                    </p>
                  </div>
                  <Badge variant="secondary">{collegesWithListings.length} colleges</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {collegesWithListings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No colleges have listings yet.</p>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm dark:bg-slate-950/50 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {collegesWithListings.length} colleges currently have marketplace items.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Open the full list to see each college name and its item count.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 shrink-0"
                      onClick={() => setShowCollegesWithListings(true)}
                    >
                      View colleges
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

      <AlertDialog open={!!pendingRejectListingId} onOpenChange={(open) => !open && setPendingRejectListingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reject this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the item as rejected and keep it hidden from public listing pages until reviewed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingRejectListingId && void handleRejectListing(pendingRejectListingId)}
            >
              Reject listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingRemoveCollegeName} onOpenChange={(open) => !open && setPendingRemoveCollegeName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this college from search?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide {pendingRemoveCollegeName ? `"${pendingRemoveCollegeName}"` : "this college"} from the college search list for users after the database change is saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingRemoveCollegeName && void handleRemoveCollege(pendingRemoveCollegeName)}
            >
              Remove college
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewListing} onOpenChange={(open) => !open && setPreviewListing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border/70 bg-background sm:max-w-3xl dark:bg-slate-950">
          {previewListing && (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-left">Listing preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm dark:bg-slate-900">
                  <div className="space-y-3 p-3">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                      {previewImages.length ? (
                        <>
                          <LqipImage
                            src={previewImages[previewImageIndex]}
                            placeholderSrc={previewPlaceholders[previewImageIndex] || previewImages[previewImageIndex]}
                            alt={`${previewListing.title} image ${previewImageIndex + 1}`}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-cover"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                          />
                          {previewImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImageIndex((current) =>
                                    current === 0 ? previewImages.length - 1 : current - 1
                                  )
                                }
                                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm dark:bg-slate-950/90"
                                aria-label="Previous preview image"
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImageIndex((current) =>
                                    current === previewImages.length - 1 ? 0 : current + 1
                                  )
                                }
                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm dark:bg-slate-950/90"
                                aria-label="Next preview image"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                                {previewImages.map((image, index) => (
                                  <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setPreviewImageIndex(index)}
                                    className={`h-2.5 rounded-full transition-all ${index === previewImageIndex ? "w-6 bg-primary" : "w-2.5 bg-background/70"}`}
                                    aria-label={`Open preview image ${index + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image uploaded</div>
                      )}
                    </div>

                    {previewImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {previewImages.map((image, index) => (
                          <button
                            key={`${image}-thumb-${index}`}
                            type="button"
                            onClick={() => setPreviewImageIndex(index)}
                            className={`overflow-hidden rounded-xl border ${index === previewImageIndex ? "border-primary ring-2 ring-primary/20" : "border-border/70"}`}
                          >
                            <LqipImage
                              src={image}
                              placeholderSrc={previewPlaceholders[index] || image}
                              alt={`Preview thumbnail ${index + 1}`}
                              className="aspect-square h-full w-full"
                              imgClassName="aspect-square h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{previewListing.category}</Badge>
                      {categoryUsesCondition(previewListing.category) && !!previewListing.condition && (
                        <Badge variant="outline">{normalizeCondition(previewListing.condition)}</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {previewListing.moderation_status.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">{previewListing.title}</h3>
                      <p className="text-3xl font-bold text-primary">₹{Number(previewListing.price).toLocaleString("en-IN")}</p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-slate-900/80">
                      <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{previewListing.description}</p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-slate-900/80">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">College</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{previewListing.college}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewListing(null)}>
                    Close
                  </Button>
                  <Button variant="outline" onClick={() => setPendingBanProfileId(previewListing.seller_id)}>
                    <Tag className="mr-2 h-4 w-4" />
                    Ban seller
                  </Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setPendingRejectListingId(previewListing.id)}>
                    Reject
                  </Button>
                  <Button onClick={() => void handleApproveListing(previewListing.id)}>
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCollegesWithListings} onOpenChange={setShowCollegesWithListings}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border/70 bg-background sm:max-w-3xl dark:bg-slate-950">
          <DialogHeader className="pb-2">
            <DialogTitle>Colleges with listings</DialogTitle>
          </DialogHeader>
          {collegesWithListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No colleges have listings yet.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {collegesWithListings.map(({ college, count }) => (
                <div
                  key={college}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3 shadow-sm dark:bg-slate-900/80"
                >
                  <p className="min-w-0 flex-1 whitespace-normal break-words text-sm font-medium leading-5 text-foreground">
                    {college}
                  </p>
                  <Badge variant="outline" className="shrink-0">
                    {count} {count === 1 ? "item" : "items"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {!isPartnerModerator && <Alert className="mb-4 border-primary/20 bg-primary/5 py-3 dark:bg-primary/10">
          <Wrench className="h-4 w-4" />
          <AlertTitle>System health</AlertTitle>
          <AlertDescription>
            Storage-backed listing images, moderation pressure, and recent client-side errors are tracked here so issues show up before users feel them.
          </AlertDescription>
        </Alert>}

        {!isPartnerModerator && healthError && (
          <Alert className="mb-4 border-amber-500/20 bg-amber-500/5 py-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTitle>Live metrics fallback</AlertTitle>
            <AlertDescription>{healthError}</AlertDescription>
          </Alert>
        )}

        {!isPartnerModerator && <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" /> Database usage monitor
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Live database, media storage, moderation load, and recent error visibility.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={usageTone}>{usageLabel}</Badge>
                  <Button variant="outline" className="h-8 px-3 text-xs" onClick={refreshSystemHealth} disabled={healthLoading}>
                    {healthLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Database used</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(databaseUsageBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Database remaining</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(remainingBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Media stored</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(storageUsageBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Storage growth 7d</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{formatBytes(storageGrowthBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pending review</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{pendingReviewCount}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Client errors 24h</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{frontendErrors24h}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stored files</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{storageObjectCount}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Assumed DB limit</p>
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

              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground shadow-sm dark:bg-slate-900/80">
                {usagePercent >= 85
                  ? "Capacity is getting tight. Open billing and review add-ons before uploads start failing."
                  : usagePercent >= 60
                    ? "Database usage is growing steadily. Media storage and moderation volume are worth watching now."
                    : "Current usage looks comfortable, and storage-backed images are keeping the site lighter than database-stored image blobs."}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle>Admin actions & recent errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80" variant="outline" onClick={() => openExternalPage(SUPABASE_BILLING_URL)}>
                Open billing page <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80" variant="outline" onClick={() => openExternalPage("https://supabase.com/docs/guides/platform/billing-on-supabase")}>
                Open billing guide <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80" variant="outline" onClick={() => openSupabasePage("storage/buckets")}>
                Open storage settings <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80" variant="outline" onClick={() => openSupabasePage("auth/users")}>
                Open auth users <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                className="h-10 w-full justify-between bg-background/70 text-xs sm:text-sm dark:bg-slate-900/80 dark:hover:bg-slate-800/80"
                variant="outline"
                onClick={handleDatabaseCleanup}
                disabled={cleaningDatabase}
              >
                {cleaningDatabase ? "Cleaning database..." : "Clean safe database junk"} <Wrench className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm dark:bg-slate-900/80">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live now</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{activeListings} active listings</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Accounts</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{profiles.length} registered users</p>
                </div>
              </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm dark:bg-slate-900/80">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Latest error events</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{recentErrors.length}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={handleClearLatestErrors}
                        disabled={recentErrors.length === 0 || clearingErrors}
                      >
                        {clearingErrors ? "Clearing..." : "Clear"}
                      </Button>
                    </div>
                  </div>
                  {recentErrors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent client-side errors were logged.</p>
                ) : (
                  <div className="space-y-2">
                    {recentErrors.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border/70 bg-card/70 p-2.5 dark:bg-slate-950/70">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-foreground">{entry.source}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{entry.message}</p>
                        {entry.route && <p className="mt-1 truncate text-[10px] text-muted-foreground">{entry.route}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>}

        <div className="mt-4 space-y-4">
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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
                <div className={`grid gap-2 ${isPartnerModerator ? "sm:grid-cols-1" : "sm:grid-cols-4"}`}>
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
                    variant={activeSection === "colleges" ? "default" : "outline"}
                    className="h-9 w-full justify-between text-xs sm:text-sm"
                    onClick={() => handleSectionChange("colleges")}
                  >
                    <span>College List</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{collegeList.length || "All"}</Badge>
                  </Button>
                  )}
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
                    <div key={request.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[1fr_auto] md:items-center dark:bg-slate-900/80">
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
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center dark:bg-slate-900/80">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {getListingCoverImage(listing.category, listing.images) ? (
                              <LqipImage
                                src={getListingCoverImage(listing.category, listing.images)}
                                placeholderSrc={getListingPreviewPlaceholders(listing.category, listing.images)[0] || getListingCoverImage(listing.category, listing.images)}
                                alt={listing.title}
                                className="h-full w-full"
                                imgClassName="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                              <Badge variant="outline" className={getListingSaleMeta(listing.sold).className}>
                                {getListingSaleMeta(listing.sold).label}
                              </Badge>
                            </div>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPreviewListing(listing)}>
                              Preview
                            </Button>
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => setPendingRejectListingId(listing.id)}>
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
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center dark:bg-destructive/10">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {getListingCoverImage(listing.category, listing.images) ? (
                              <LqipImage
                                src={getListingCoverImage(listing.category, listing.images)}
                                placeholderSrc={getListingPreviewPlaceholders(listing.category, listing.images)[0] || getListingCoverImage(listing.category, listing.images)}
                                alt={listing.title}
                                className="h-full w-full"
                                imgClassName="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                              <Badge variant="destructive" className="text-[10px]">10h+ pending</Badge>
                              <Badge variant="outline" className={getListingSaleMeta(listing.sold).className}>
                                {getListingSaleMeta(listing.sold).label}
                              </Badge>
                            </div>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPreviewListing(listing)}>
                              Preview
                            </Button>
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => setPendingRejectListingId(listing.id)}>
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
                        <div key={listing.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[128px_1fr_auto] md:items-center dark:bg-slate-900/80">
                          <div className="h-28 overflow-hidden rounded-2xl bg-muted">
                            {getListingCoverImage(listing.category, listing.images) ? (
                              <LqipImage
                                src={getListingCoverImage(listing.category, listing.images)}
                                placeholderSrc={getListingPreviewPlaceholders(listing.category, listing.images)[0] || getListingCoverImage(listing.category, listing.images)}
                                alt={listing.title}
                                className="h-full w-full"
                                imgClassName="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                              <Badge variant={listing.moderation_status === "hidden" ? "destructive" : "secondary"} className="text-[10px] capitalize">{listing.moderation_status}</Badge>
                              <Badge variant="outline" className={getListingSaleMeta(listing.sold).className}>
                                {getListingSaleMeta(listing.sold).label}
                              </Badge>
                            </div>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{listing.description}</p>
                            <p className="text-sm font-semibold text-foreground">Rs. {Number(listing.price).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:flex-col">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPreviewListing(listing)}>
                              Preview
                            </Button>
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleApproveListing(listing.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingBanProfileId(listing.seller_id)}>
                              Ban seller
                            </Button>
                            {isPartnerModerator ? (
                              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => setPendingRejectListingId(listing.id)}>
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

          {activeSection === "colleges" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> College list
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add or remove colleges from search. The list is shown alphabetically.
                  </p>
                </div>
                <Badge variant="secondary">{collegeList.length} visible</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {collegeOverrideError && (
                <Alert variant="destructive">
                  <AlertTitle>Database update needed</AlertTitle>
                  <AlertDescription>{collegeOverrideError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[1fr_auto] dark:bg-slate-950/50">
                <Input
                  value={newCollegeName}
                  onChange={(event) => setNewCollegeName(event.target.value)}
                  placeholder="Add college name..."
                  className="h-10"
                />
                <Button className="h-10" onClick={handleAddCollege} disabled={loadingColleges || !newCollegeName.trim()}>
                  Add College
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <Input
                  value={collegeListSearch}
                  onChange={(event) => setCollegeListSearch(event.target.value)}
                  placeholder="Search colleges..."
                  className="h-10"
                />
                <Button variant="outline" className="h-10" onClick={refreshCollegeList} disabled={loadingColleges}>
                  Refresh
                </Button>
              </div>

              {loadingColleges ? (
                <p className="text-sm text-muted-foreground">Loading colleges...</p>
              ) : visibleCollegeList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No colleges match this search.</p>
              ) : (
                <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {visibleCollegeList.map((college) => (
                    <div
                      key={college}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm dark:bg-slate-950/50"
                    >
                      <p className="min-w-0 flex-1 whitespace-normal break-words text-sm font-medium leading-5 text-foreground">{college}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 text-xs text-destructive hover:text-destructive"
                        onClick={() => setPendingRemoveCollegeName(college)}
                        disabled={loadingColleges}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {activeSection === "members" && (
          <Card className="overflow-hidden border-border/70 bg-background/80 shadow-sm dark:bg-slate-900/80">
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
                    <div key={profile.id} className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm dark:bg-slate-900/80">
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
